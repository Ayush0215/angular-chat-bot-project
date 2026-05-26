import base64
from math import exp
from unittest import result
from fastapi import FastAPI, HTTPException, Query,Body, Depends, UploadFile, Form, File,  Security
from fastapi import security
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from httpx import request
from jwt import InvalidTokenError
from pydantic import BaseModel
from typing import List, Optional, Dict
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from passlib.context import CryptContext
from jose import jwt, JWTError
import io
from PyPDF2 import PdfReader
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from passlib.hash import bcrypt
from bson import ObjectId

import logging
from logging.handlers import RotatingFileHandler
import gridfs



class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None
    conversation_id: Optional[str] = None
    

class Conversation(BaseModel):
    messages: List[Message]
    conversation_id: Optional[str] = None

class ConversationResponse(BaseModel):
    userInput: str
    aiResponse: str


class UserLogin(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    message: str
    type: str
    userName: str

class SignUpRequest(BaseModel):
    
    userName: str
    email: str
    password: str
    
class Credentails(BaseModel):
    userName: str
    email: str
    password: str 
    type: str = "employee"

class Token(BaseModel):
    access_token: str
    Token_type: str

class TokenData(BaseModel):
    token: str

class ModelPerformance(BaseModel):
    model_name: str
    response_time: float
    accuracy: float

class ModelPerformanceResponse(BaseModel):
    id: str
    model_name: str
    response_time: float
    accuracy: float
    timestamp: datetime

class APIUsage(BaseModel):
    user_id:str
    model_name: str
    request_count: int
    timestamp: datetime = datetime.utcnow()


def setup_logging():
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Configure the root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Console handler with custom formatter
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    
    # File handler with rotation
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(file_format)
    
    # Add handlers to root logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Suppress debug logs from PyMongo
logging.getLogger("pymongo").setLevel(logging.WARNING)


# Load environment variables
load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods= ["*"],
    allow_headers=["*"],
)

# Working on Logging 
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Working on Pinecone Vector Database 
# Initialize Pinecone with new syntax
pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY")
)

# Initialize the embedding model (outputs 1024-dimensional embeddings)
model = SentenceTransformer('BAAI/bge-large-en-v1.5')



@app.post("/create-index")
async def create_index(conversation_name: str = Body(..., embed=True)):
    try:
        # Sanitize the conversation name
        sanitized_name = conversation_name.strip()
        

        if sanitized_name in pc.list_indexes().names():
            raise HTTPException(
                status_code=400,
                detail="Index {sanitized_name} already exists",
            )
        
        # Create new index if it doesn't exist
        if sanitized_name not in pc.list_indexes().names():
            pc.create_index(
                name=sanitized_name,
                dimension=1024,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud='aws',
                    region='us-east-1'
                )
            )
            return {
                "status": "success",
                "message": f"Index {sanitized_name} created successfully",
                "index_name": sanitized_name
            }
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Index {sanitized_name} already exists"
            )
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        print("Error creating index:")
        raise HTTPException(status_code=500, detail=str(e))


# Function to store the conversation in the specified index

@app.post("/store-conversation")
async def store_conversation(conversation: Conversation, index_name:str = None):
    try:
        available_indexes = pc.list_indexes().names()
        if not index_name:
            raise HTTPException(
                status_code=404,
                detail=f"Index '{index_name}' not found. Available indexes: {available_indexes}"
            )
        print(f"Storing conversation in index: {index_name}")

        # Verify that the index exists
        

        logger.error(f"Available indexes: {available_indexes}")  # Debugging output
        print(f"Received index name: {index_name}")  # Debugging output
        
        if index_name not in available_indexes:
            raise HTTPException(
                status_code=404,
                detail=f"Index '{index_name}' not found. Available indexes: {available_indexes}"
            )

        # Get the index
        index = pc.Index(index_name)
        print(f"Successfully connected to index: {index_name}")

        conversation_id = conversation.conversation_id or f"conv_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Store the conversation in Pinecone index
        vectors = []
        for idx, message in enumerate(conversation.messages):
            # Create embedding for the message content
            embedding = model.encode(message.content).tolist()
            
            # Prepare metadata
            metadata = {
                "role": message.role,
                "content": message.content,
                "timestamp": message.timestamp or datetime.now().isoformat(),
                "message_index": idx,
                "conversation_id": conversation_id
                
            }

            # Create vector ID using timestamp and index
            vector_id = f"msg_{idx}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            vectors.append((vector_id, embedding, metadata))

        # Upsert vectors in batch
        print(f"Upserting {len(vectors)} vectors to index")
        index.upsert(vectors=vectors)

        return {
            "status": "success",
            "message": f"Conversation stored successfully in index: {index_name}",
            "vectors_stored": len(vectors),
    
        }

    except Exception as e:
        import traceback
        print("Error in store_conversation:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/indexes")
async def get_indexes():
    try:
        #Fetch the list of indexes
        indexes = pc.list_indexes().names()
        return {"indexes": indexes}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete-index/{index_name}")
async def delete_index(index_name: str):
    try:
        # Check if the index exists before attempting to delete
        if index_name not in pc.list_indexes().names():
            raise HTTPException(status_code=404, detail="Index not found")
        
        # Delete the index
        pc.delete_index(index_name)

        return {"status": "success", "message": f"Index {index_name} deleted successfully"}
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/get-conversation/")
async def get_conversation(
    index_name: str,
    limit: int = Query(10, ge=1, description="Number of items to return per page"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    group_by: Optional[str] = Query(None, description="Field to group results by"),
    sort_by: Optional[str] = Query(None, description="Field to sort results by"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc or desc)")):
    try:
        # Validate index name
        if index_name not in pc.list_indexes().names():
            raise HTTPException(status_code=404, detail=f"Index '{index_name}' not found.")

        # Get the index and its stats
        index = pc.Index(index_name)
        index_stats = index.describe_index_stats()
        total_records = index_stats.get("namespaces", {}).get("", {}).get("vector_count", 0)

        # Fetch data with a dummy vector
        dimension = index_stats.get("dimension", 1024)
        dummy_vector = [0.0] * dimension
        query_response = index.query(
            vector=dummy_vector,
            top_k=min(1000, total_records),  # Fetch up to 1000 records or total_records
            include_metadata=True
        )

        # Extract metadata from query results
        results = [match.metadata for match in query_response.matches]

        # Apply sorting if sort_by is specified
        if sort_by:
            reverse = sort_order.lower() == "desc"
            results.sort(key=lambda x: x.get(sort_by, ""), reverse=reverse)
        else:
            results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        # Group results if group_by is specified
        if group_by:
            grouped = {}
            for item in results:
                group_key = item.get(group_by)
                if group_key is not None:
                    if group_key not in grouped:
                        grouped[group_key] = []
                    grouped[group_key].append(item)

            # Convert to list of groups and apply pagination
            group_list = list(grouped.items())
            paginated_groups = group_list[offset:offset + limit]

            # Calculate group-based totals
            total_groups = len(group_list)
            has_more = (offset + limit) < total_groups

            return {
                "data": [{"group_key": k, "items": v} for k, v in paginated_groups],
                "total": total_groups,
                "has_more": has_more
            }
        else:
            # Apply pagination to individual items
            paginated_results = results[offset:offset + limit]
            has_more = (offset + limit) < total_records

            return {
                "data": paginated_results,
                "total": total_records,
                "has_more": has_more
            }

    except HTTPException:
        raise  # Re-raise HTTPException to return custom error responses
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while fetching conversations.")

@app.post("/upload-conversation/")
async def upload_conversation(userInput: str = Form(...), file: UploadFile = File(...)):
    #Read file content based on file type
    if file.filename.endswith(".pdf"):

        pdf_reader = PdfReader(file.file)
        text = ''
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    else:
        text = (await file.read().decode('utf-8', error='ignore'))

    # Create result dictionary
    result = {
        "userInput": userInput,
        "fileName": file.filename,
        "fileContent": text
    }

    #Log to console
    print("Received upload:", result)

    return result



#Working on MongoDB Database 
#MongoDB connection
client = MongoClient("mongodb://localhost:27017")
db = client['chat_database']
collection = db["login-llm"]
model_performance_collection = db["model_performance"]
api_usage_collection = db["api_usage"]
profiles_collection = db["profiles"]
model_config_collection = db["model_config"]

fs = gridfs.GridFS(db)




#Jwt Secret and Algroithm

SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MAX_FILE_SIZE = 10 * 1024 * 1024

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")




def create_access_token(data: dict,role: str,expires_delta: timedelta = timedelta(ACCESS_TOKEN_EXPIRE_MINUTES)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire, "role": role})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



@app.post("/refresh_token/")
async def refresh_token(refresh_token: str):
    try:
        # Decode the refresh token
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # Issue a new access token (resetting expiry time to 15 minutes)
        new_access_token = create_access_token(data={"sub": email}, expires_delta=timedelta(minutes=30))
        return {"access_token": new_access_token}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

def get_user(email: str):
    return collection.find_one({"email": email})

def verify_password(plain_password, hashed_password):
    return bcrypt.verify(plain_password, hashed_password)

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return None
    if not verify_password(password, user["password"]):
        return None
    return user

def get_current_user(token: str = Security(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub")
        role = payload.get("role")
        if user_email is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"email": user_email, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
def admin_required(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied: Admins only")
    return user

@app.get("/admin-dashboard/")
async def admin_dashboard(user: dict = Depends(admin_required)):
    return {"message": "Welcome to the admin dashboard"}

def employee_required(user: dict = Depends(get_current_user)):
    if user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Access denied: Employees only")
    return user

@app.get("/employee-dashboard")
async def employee_dashboard(user: dict = Depends(employee_required)):
    return {"message": "Welcome to the employee dashboard"}

@app.get("/common-dashboard/")
async def common_dashboard(user: dict = Depends(get_current_user)):
    return {"message": f"Welcome, {user['role']}!"}


@app.get("/secure-data/")
async def get_secure_data(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"message": "Access granted to secure data!"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

def is_token_revoked(token: str) -> bool:
    return revoked_tokens_collection.find_one({"token": token}) is not None

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        if is_token_revoked(token):
            raise HTTPException(status_code=401, detail="Token has been revoked")

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub")
        role = payload.get("role")

        if user_email is None or role is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"email": user_email, "role": role}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token is expired or invalid")
    

revoked_tokens_collection = db["revoked_tokens"]

@app.post("/logout/")
async def logout(token: str = Depends(oauth2_scheme)):
    revoked_tokens_collection.insert_one({"token": token, "revoked_at": datetime.utcnow()})
    return {"message": "Token revoked successfully"}



@app.post("/login")
async def login(user: UserLogin):
    try:
    
        # Fetch user from MongoDB
        db_user = collection.find_one({"email": user.email})
        if not db_user:
            logger.warning(f"User not found: {user.email}")
            raise HTTPException(status_code=400, detail="Invalid email or password")

    

        # Verify the password
        if not pwd_context.verify(user.password, db_user['password']):
            logger.warning(f"Incorrect password for: {user.email}")
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Generate access token
        access_token = create_access_token(
            data={"sub": user.email},
            role=db_user.get("type"),
            expires_delta=timedelta(minutes=30)
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "userName": db_user.get('userName'),
            "email": db_user.get('email'),
            "type": db_user.get('type')
        }

    except Exception as e:
        logger.error(f"Error during login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error")




@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id or not db.users.find_one({"_id": ObjectId(user_id)}):
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return {"message": "You have access"}


def verify_jwt(token: str) -> bool:
    """Function to verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return True
    except InvalidTokenError:
        return False
    
@app.post("/verify-token/")
async def verify_token(data: TokenData) -> Dict[str, bool]:
    """Verify if the JWT token is valid"""
    if not data.token:
        raise HTTPException(status_code=400, detail="Token is required")

    is_valid = verify_jwt(data.token)
    return {"valid": is_valid}

@app.get("/api/login-llm")
async def get_login_data():
    try:
        # Convert ObjectId to string
        login_data = [
            {**doc, "_id": str(doc["_id"])} for doc in collection.find()
        ]
        return JSONResponse(content={"success": True, "data": login_data}, status_code=200)
    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(content={"success": False, "error": str(e)}, status_code=500)
    

@app.post("/get-user-details/{email}")
async def get_user_details(email: str):
    try:
        print(f"Searching for user with email: {email}")  # Log input email
        
        # Debug: Log collection content (remove for production)
        users = collection.find({})
        print("All users in collection:")
        for user in users:
            print(user)

        # Attempt to find the user
        user = collection.find_one({"email": email})
        print(f"Query result: {user}")  # Log query result

        if user:
            user_details = {
                "email": user.get("email"),
                "type": user.get("type"),
                "userName": user.get("userName", "N/A"),
                "Uid": str(user.get("Uid", "N/A")),
            }
            return user_details

        print(f"User with email '{email}' not found.")  # Debug log
        raise HTTPException(status_code=404, detail="User not found")

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/sign-up/")
async def sign_up(user: SignUpRequest):
    # Check if the user already exists
    existing_user = collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered.")

    # Hash the password
    hashed_password = pwd_context.hash(user.password)
    
    # Save the user to the database
    user_data = {"Uid": str(ObjectId()), "userName": user.userName,"email": user.email, "password": hashed_password, "type": "employee"}
    collection.insert_one(user_data)
    
    return {"message": "User registered successfully!"}

@app.get("/credentials/")
async def get_credentials():
    try:
        # Retrieve all credentials from the database
        credentials = list(
            collection.find({}, {"_id": 0,"Uid": 1, "userName": 1, "email": 1, "password": 1, "type": 1})
        )

        # Convert the ObjectId to string for compatibility with JSON
        for credential in credentials:
            credential["Uid"] = str(credential["Uid"])

        # If no credentials are found
        if not credentials:
            raise HTTPException(status_code=404, detail="No credentials found")

        return credentials

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


def credentials_helper(credentials) -> dict:
    return {
        "Uid": str(credentials["Uid"]),
        "userName": credentials["userName"],
        "email": credentials["email"],
        "password": credentials["password"],
        "type": credentials["type"]
    }
    
@app.delete("/credentials/{uid}")
async def delete_credential(uid: str):
    try:
        # Find and delete the credential with the specified Uid
        result = collection.delete_one({"Uid": uid})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"No credential found with Uid: {uid}")
        
        return {"message": f"Credential with Uid {uid} successfully deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.put("/credentials/{uid}")
async def update_credential(uid: str, credentials: Credentails):
    try:
        # Print the credentials data received from the request
        print(f"Received credentials to update: {credentials}")
        
        # Update the credentials in the database
        result = collection.update_one(
            {"Uid": uid},
            {"$set": {
                "userName": credentials.userName,
                "email": credentials.email,
                "password": credentials.password,
                "type": credentials.type,
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail=f"No credential found with Uid: {uid}")
        
        return {"message": f"Credential with Uid {uid} successfully updated."}
    
    except Exception as e:
        print(f"Error updating credential: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    



@app.get("/count/")
def get_account_count():
    try:
        # Try to fetch the account count from the database
        count = collection.count_documents({})
        return {"account_count": count}  # Make sure the response is an object with `account_count`
    
    except PyMongoError as e:
        # Catch MongoDB related errors and raise an HTTPException with a status code
        raise HTTPException(status_code=500, detail=f"Error accessing the database: {str(e)}")
    
    except Exception as e:
        # Catch any other general exceptions and raise an HTTPException with a status code
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@app.get("/api/accounts/count")
async def get_account_count_type():
    try:
        admin_count = collection.count_documents({"type":"admin"})
        employee_count = collection.count_documents({"type": "employee"})

        return{
            "admin_count": admin_count,
            "employee_count": employee_count
        }
    except Exception as e:
        return {"error": str(e)}



@app.post("/model-performance")
async def log_model_performance(data: ModelPerformance):
    try:
        # Convert to dictionary and add a timestamp
        record = data.model_dump()  # Use model_dump() if using Pydantic v2, else data.dict()
        record["timestamp"] = datetime.utcnow()

        # Insert into MongoDB
        result =  model_performance_collection.insert_one(record)
        return {
            "message": "Model performance logged successfully.",
             "id": str(result.inserted_id)}  # No 'await' on inserted_id

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: Database error: {e}")

@app.get("/model-performance", response_model=list[ModelPerformanceResponse])
async def get_model_performance():
    try:
        # Fetch all records from MongoDB
        records = model_performance_collection.find().to_list(100)

        # Convert ObjectId to string
        for record in records:
            record["id"] = str(record["_id"])
            del record["_id"]  # Remove _id as it's already in 'id'

        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: Database error: {e}")


@app.post("/upload-profile/")
async def upload_profile(uid: str = Form(...), file: UploadFile = File(...)):
    try:
        #Check if user exists in login-llm collection
        user = collection.find_one({"Uid": uid}, {"userName": 1, "email": 1, "_id":0})
        if not user:
            return JSONResponse(content={"error": "User not found"}, status_code=404)
        
        #Store image in GridFs
        file_id = fs.put(file.file, filename= file.filename, content_type=file.content_type)

        #Store profile with 'userName and email' only

        profile_data = {
            "Uid": uid,
            "userName": user["userName"],
            "email": user["email"],
            "profile_image_id": file_id
        }
        profiles_collection.insert_one(profile_data)

        return JSONResponse(content={"message": "Profile uploaded"}, status_code=201)
    except Exception as e:
        return JSONResponse(content={" error": str(e)}, status_code=500)

@app.get("/profile-image/{Uid}")
async def get_profile_image(Uid: str):
    try:
        file = fs.get(ObjectId(Uid))
        return StreamingResponse(io.BytesIO(file.read()), media_type=file.content_type)
    except:
        return JSONResponse(content={"error": "Image not found"}, status_code=404)


    
class APIUsageResponse(BaseModel):
    id: str
    user_id: str
    model_name: str
    request_count: int
    timestamp: datetime
    
@app.get("/api-usage/", response_model=list[APIUsageResponse])
async def get_api_usage():
    try:
        # Fetch all records from MongoDB
        records = api_usage_collection.find().to_list(100)

        # Convert ObjectId to string
        for record in records:
            record["id"] = str(record["_id"])
            del record["_id"]  # Remove _id as it's already in 'id'

        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: Database error: {e}")

    
                            



# In Database storage for model settings (Replace with DB in production)


# Define request model
class ModelConfigUpdate(BaseModel):
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    status: Optional[str] = None

@app.get("/model/config")
def get_model_config():
    config = model_config_collection.find_one({"_id": "active_config"})
    if config is None:
        default_config = {
            "_id": "active_config",
            "model_name": "deepseek-r1-distill-qwen-32b",
            "temperature": 0.7,
            "max_tokens": 4096,
            "top_p": 0.96,
            "status": "active"
        }
        model_config_collection.insert_one(default_config)
        return default_config
    del config["_id"]
    return config

@app.put("/model/config")
def update_model_config(config: ModelConfigUpdate):
    update_data = config.dict(exclude_unset=True)
    model_config_collection.update_one({"_id": "active_config"}, {"$set": update_data},upsert= True)

    updated_config = model_config_collection.find_one({"_id": "active_config"})
    del updated_config["_id"]
    return updated_config




projects_collection = db["projects"]


@app.get("/search")
async def global_search(q: str = Query(..., min_length=1)):
    if len(q) < 1:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters long.")
    try:
        # Define a helper function to format results
        def format_results(collection_results, result_type, title_field, description_field):
            return [
                {
                    "type": result_type,
                    "id": str(result["_id"]),
                    "title": result.get(title_field, "No title"),
                    "description": result.get(description_field, "No description")
                }
                for result in collection_results
            ]

        # Search across all collections with your variable names
        login_llm_results = list(collection.find({
            "$or": [
                {"userName": {"$regex": f"^{q}", "$options": "i"}},
                {"email": {"$regex": f"^{q}", "$options": "i"}}
            ]
        }))
        model_performance_results = list(model_performance_collection.find({
            "model_name": {"$regex": f"^{q}", "$options": "i"}
        }))
        api_usage_results = list(api_usage_collection.find({
            "model_name": {"$regex": f"^{q}", "$options": "i"}
        }))
        profiles_results = list(profiles_collection.find({
            "userName": {"$regex": f"^{q}", "$options": "i"}
        }))
        model_config_results = list(model_config_collection.find({
            "model_name": {"$regex": f"^{q}", "$options": "i"}
        }))

        # Only include security_results if the query matches "security"
        security_results = []
        if "security".startswith(q.lower()):
            security_results = [{
                "type": "security",
                "id": "security",
                "title": "Security",
                "description": "Manage your security settings"
            }]
        if "chat-on".startswith(q.lower()):
            security_results = [{
                "type": "chat-on",
                "id": "chat-on",
                "title": "Chat-on",
                "description": "Manage your security settings"
            }]
        
        # Combine results from all collections
        results = []

        # Use the helper function to format the results
        results.extend(format_results(login_llm_results, "user", "userName", "email"))
        results.extend(format_results(model_performance_results, "model_performance", "model_name", "details"))
        results.extend(format_results(api_usage_results, "api_usage", "model_name", "usage_count"))
        results.extend(format_results(profiles_results, "profile", "userName", "email"))
        results.extend(format_results(model_config_results, "model_config", "model_name", "configuration"))
        results.extend(security_results)

        return {"results": results}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An error occurred during search.")


