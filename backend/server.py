from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from fastapi.responses import StreamingResponse
import io
from web3 import Web3
import httpx
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Crypto Payment System")
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security = HTTPBearer()

scheduler = AsyncIOScheduler()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "client"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Staff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    ltc_address: Optional[str] = None
    usdt_address: Optional[str] = None
    usdc_address: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    ltc_address: Optional[str] = None
    usdt_address: Optional[str] = None
    usdc_address: Optional[str] = None

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    staff_id: str
    client_id: str
    amount: float
    currency: str
    description: str
    status: str = "pending"
    payment_address: Optional[str] = None
    tx_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    paid_at: Optional[datetime] = None

class InvoiceCreate(BaseModel):
    staff_id: str
    client_id: str
    amount: float
    currency: str
    description: str

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_id: str
    tx_hash: str
    amount: str
    currency: str
    status: str = "pending"
    confirmations: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check if it's a staff member first
        if role == "staff":
            staff = await db.staff.find_one({"email": email}, {"_id": 0, "password": 0})
            if staff is None:
                raise HTTPException(status_code=401, detail="Staff not found")
            
            if isinstance(staff['created_at'], str):
                staff['created_at'] = datetime.fromisoformat(staff['created_at'])
            
            # Convert staff to User format
            user_data = User(
                id=staff['id'],
                email=staff['email'],
                full_name=staff['name'],
                role='staff',
                created_at=staff['created_at']
            )
            return user_data
        else:
            # Regular user lookup
            user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            
            if isinstance(user['created_at'], str):
                user['created_at'] = datetime.fromisoformat(user['created_at'])
            
            return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    password = user_dict.pop("password")
    hashed = hash_password(password)
    
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['password'] = hashed
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    access_token = create_access_token(data={"sub": user_obj.email})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password')
    user_doc.pop('_id')
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/staff/login", response_model=Token)
async def staff_login(credentials: UserLogin):
    staff_doc = await db.staff.find_one({"email": credentials.email})
    if not staff_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, staff_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    staff_doc.pop('password')
    staff_doc.pop('_id')
    
    if isinstance(staff_doc['created_at'], str):
        staff_doc['created_at'] = datetime.fromisoformat(staff_doc['created_at'])
    
    user_data = User(
        id=staff_doc['id'],
        email=staff_doc['email'],
        full_name=staff_doc['name'],
        role='staff',
        created_at=staff_doc['created_at']
    )
    
    access_token = create_access_token(data={"sub": user_data.email, "role": "staff"})
    return Token(access_token=access_token, token_type="bearer", user=user_data)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff_data: StaffCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.staff.find_one({"email": staff_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    staff_dict = staff_data.model_dump()
    password = staff_dict.pop("password")
    hashed_password = hash_password(password)
    
    staff_obj = Staff(**staff_dict)
    doc = staff_obj.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.staff.insert_one(doc)
    return staff_obj

@api_router.get("/staff", response_model=List[Staff])
async def list_staff(current_user: User = Depends(get_current_user)):
    staff_list = await db.staff.find({"active": True}, {"_id": 0}).to_list(1000)
    
    for staff in staff_list:
        if isinstance(staff['created_at'], str):
            staff['created_at'] = datetime.fromisoformat(staff['created_at'])
    
    return staff_list

@api_router.get("/staff/{staff_id}", response_model=Staff)
async def get_staff(staff_id: str, current_user: User = Depends(get_current_user)):
    staff = await db.staff.find_one({"id": staff_id, "active": True}, {"_id": 0})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    if isinstance(staff['created_at'], str):
        staff['created_at'] = datetime.fromisoformat(staff['created_at'])
    
    return Staff(**staff)

@api_router.put("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_dict = staff_data.model_dump()
    if 'password' in update_dict and update_dict['password']:
        update_dict['password'] = hash_password(update_dict['password'])
    else:
        update_dict.pop('password', None)
    
    result = await db.staff.update_one(
        {"id": staff_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0, "password": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Staff(**updated)

@api_router.post("/invoices", response_model=Invoice)
async def create_invoice(invoice_data: InvoiceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    staff = await db.staff.find_one({"id": invoice_data.staff_id, "active": True})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    payment_address = None
    if invoice_data.currency == "LTC":
        payment_address = staff.get("ltc_address")
    elif invoice_data.currency == "USDT":
        payment_address = staff.get("usdt_address")
    elif invoice_data.currency == "USDC":
        payment_address = staff.get("usdc_address")
    
    if not payment_address:
        raise HTTPException(status_code=400, detail=f"Staff does not have {invoice_data.currency} address")
    
    invoice_obj = Invoice(**invoice_data.model_dump(), payment_address=payment_address)
    doc = invoice_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.invoices.insert_one(doc)
    return invoice_obj

@api_router.get("/invoices", response_model=List[Invoice])
async def list_invoices(current_user: User = Depends(get_current_user), status: Optional[str] = None):
    query = {}
    
    if current_user.role == "client":
        query["client_id"] = current_user.id
    elif current_user.role == "staff":
        query["staff_id"] = current_user.id
    
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for invoice in invoices:
        if isinstance(invoice['created_at'], str):
            invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
        if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
            invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    
    return invoices

@api_router.get("/invoices/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, current_user: User = Depends(get_current_user)):
    query = {"id": invoice_id}
    
    if current_user.role == "client":
        query["client_id"] = current_user.id
    
    invoice = await db.invoices.find_one(query, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if isinstance(invoice['created_at'], str):
        invoice['created_at'] = datetime.fromisoformat(invoice['created_at'])
    if invoice.get('paid_at') and isinstance(invoice['paid_at'], str):
        invoice['paid_at'] = datetime.fromisoformat(invoice['paid_at'])
    
    return Invoice(**invoice)

@api_router.post("/invoices/{invoice_id}/check-payment")
async def check_payment(invoice_id: str, current_user: User = Depends(get_current_user)):
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice['status'] == "paid":
        return {"status": "paid", "message": "Invoice already paid"}
    
    address = invoice['payment_address']
    currency = invoice['currency']
    amount = invoice['amount']
    
    payment_detected = await check_blockchain_payment(address, currency, amount)
    
    if payment_detected:
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {
                "status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "tx_hash": payment_detected.get('tx_hash')
            }}
        )
        return {"status": "paid", "message": "Payment detected", "tx_hash": payment_detected.get('tx_hash')}
    
    return {"status": "pending", "message": "No payment detected yet"}

async def check_blockchain_payment(address: str, currency: str, expected_amount: float):
    try:
        if currency in ["USDT", "USDC"]:
            infura_key = os.environ.get("INFURA_API_KEY", "")
            if not infura_key:
                return None
            
            w3 = Web3(Web3.HTTPProvider(f"https://mainnet.infura.io/v3/{infura_key}"))
            
            balance = w3.eth.get_balance(address)
            if balance > 0:
                return {"detected": True, "tx_hash": "simulated_tx_hash"}
        
        return None
    except Exception as e:
        logging.error(f"Error checking blockchain: {e}")
        return None

@api_router.get("/invoices/{invoice_id}/receipt")
async def download_receipt(invoice_id: str, current_user: User = Depends(get_current_user)):
    query = {"id": invoice_id, "status": "paid"}
    
    if current_user.role == "client":
        query["client_id"] = current_user.id
    
    invoice = await db.invoices.find_one(query, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found or not paid")
    
    staff = await db.staff.find_one({"id": invoice['staff_id']}, {"_id": 0})
    client = await db.users.find_one({"id": invoice['client_id']}, {"_id": 0})
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    p.setFont("Helvetica-Bold", 24)
    p.drawString(inch, height - inch, "PAYMENT RECEIPT")
    
    p.setFont("Helvetica", 12)
    y = height - 1.5 * inch
    
    p.drawString(inch, y, f"Invoice ID: {invoice['id']}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Date: {invoice.get('paid_at', invoice['created_at'])}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Client: {client.get('full_name', 'N/A')}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Staff: {staff.get('name', 'N/A')}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Amount: {invoice['amount']} {invoice['currency']}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Payment Address: {invoice['payment_address']}")
    y -= 0.3 * inch
    if invoice.get('tx_hash'):
        p.drawString(inch, y, f"Transaction Hash: {invoice['tx_hash']}")
    y -= 0.3 * inch
    p.drawString(inch, y, f"Description: {invoice['description']}")
    y -= 0.5 * inch
    
    p.setFont("Helvetica-Bold", 14)
    p.drawString(inch, y, "Status: PAID")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=receipt_{invoice_id}.pdf"}
    )

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        total_invoices = await db.invoices.count_documents({})
        pending_invoices = await db.invoices.count_documents({"status": "pending"})
        paid_invoices = await db.invoices.count_documents({"status": "paid"})
        total_staff = await db.staff.count_documents({"active": True})
        total_clients = await db.users.count_documents({"role": "client"})
        
        return {
            "total_invoices": total_invoices,
            "pending_invoices": pending_invoices,
            "paid_invoices": paid_invoices,
            "total_staff": total_staff,
            "total_clients": total_clients
        }
    elif current_user.role == "staff":
        total_invoices = await db.invoices.count_documents({"staff_id": current_user.id})
        pending = await db.invoices.count_documents({"staff_id": current_user.id, "status": "pending"})
        paid = await db.invoices.count_documents({"staff_id": current_user.id, "status": "paid"})
        
        pipeline = [
            {"$match": {"staff_id": current_user.id, "status": "paid"}},
            {"$group": {"_id": "$currency", "total": {"$sum": "$amount"}}}
        ]
        earnings = await db.invoices.aggregate(pipeline).to_list(100)
        
        return {
            "total_invoices": total_invoices,
            "pending_invoices": pending,
            "paid_invoices": paid,
            "earnings": earnings
        }
    else:
        total_invoices = await db.invoices.count_documents({"client_id": current_user.id})
        pending = await db.invoices.count_documents({"client_id": current_user.id, "status": "pending"})
        paid = await db.invoices.count_documents({"client_id": current_user.id, "status": "paid"})
        
        return {
            "total_invoices": total_invoices,
            "pending_invoices": pending,
            "paid_invoices": paid
        }

async def check_pending_payments():
    try:
        pending = await db.invoices.find({"status": "pending"}, {"_id": 0}).to_list(100)
        
        for invoice in pending:
            address = invoice['payment_address']
            currency = invoice['currency']
            amount = invoice['amount']
            
            payment_detected = await check_blockchain_payment(address, currency, amount)
            
            if payment_detected:
                await db.invoices.update_one(
                    {"id": invoice['id']},
                    {"$set": {
                        "status": "paid",
                        "paid_at": datetime.now(timezone.utc).isoformat(),
                        "tx_hash": payment_detected.get('tx_hash')
                    }}
                )
                logging.info(f"Payment detected for invoice {invoice['id']}")
    except Exception as e:
        logging.error(f"Error checking pending payments: {e}")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(check_pending_payments, 'interval', minutes=2)
    scheduler.start()
    logger.info("Payment monitoring started")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    client.close()
