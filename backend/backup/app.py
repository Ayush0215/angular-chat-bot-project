from fastapi import FastAPI, HTTPException, Query,Body, File, UploadFile, Form,File, Depends
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import requests
from datetime import datetime
from fastapi.responses import JSONResponse
from passlib.context import CryptContext
from jose import jwt, JWTError
from io import BytesIO
from PyPDF2 import PdfReader
from pymongo import MongoClient
from passlib.hash import bcrypt
from bson import ObjectId
import hashlib
import logging


# Load environment variables
load_dotenv()

logging.basicConfig(level= logging.DEBUG)
logger = logging.getLogger(__name__)




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods= ["*"],
    allow_headers=["*"],
)



# Initialize Pinecone with new syntax
pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY")
)

# Initialize the vector database with 1024 dimensions
# index_name = "conversation-two"
# if index_name not in pc.list_indexes().names():
#     pc.create_index(
#         name=index_name,
#         dimension=1024,  # Updated to 1024 dimensions to match the model
#         metric='cosine',
#         spec=ServerlessSpec(
#             cloud='aws',
#             region='us-east-1'
#         )
#     )




# Initialize the embedding model (outputs 1024-dimensional embeddings)
model = SentenceTransformer('BAAI/bge-large-en-v1.5')

class Message(BaseModel):
    role: str
    content: str
    timestamp: Optional[str] = None

class Conversation(BaseModel):
    messages: List[Message]



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
#@app.post("/store-conversation/{create_index(new_index_name)}")
@app.post("/store-conversation")
async def store_conversation(conversation: Conversation, index_name: str = None):
    try:
        if not index_name:
            raise HTTPException(
                status_code=400,
                detail="Index name is required"
            )
        

            
        print(f"Storing conversation in index: {index_name}")

        # Verify that the index exists
        available_indexes = pc.list_indexes().names()
        print(f"Available indexes: {available_indexes}")
        
        if index_name not in available_indexes:
            raise HTTPException(
                status_code=404,
                detail=f"Index '{index_name}' not found. Available indexes: {available_indexes}"
            )

        # Get the index
        index = pc.Index(index_name)
        print(f"Successfully connected to index: {index_name}")

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
                "message_index": idx
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
            "vectors_stored": len(vectors)
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
    



#MongoDB connection api
client = MongoClient("mongodb://localhost:27017")
db = client['chat_database']
collection = db["login-llm"]


#Jwt Secret and Algroithm

SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
ALGORITHM = 'HS256'

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")






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
    type: str

class Token(BaseModel):
    access_token: str
    Token_type: str


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
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
        new_access_token = create_access_token(data={"sub": email}, expires_delta=timedelta(minutes=15))
        return {"access_token": new_access_token}

    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")

def get_user(email: str):
    return db.users.find_one({"email": email})

def verify_password(plain_password, hashed_password):
    return bcrypt.verify(plain_password, hashed_password)

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user or not verify_password(password, user["password"]):
        return None
    return user

@app.get("/secure-data/")
async def get_secure_data(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"message": "Access granted to secure data!"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token has expired or is invalid")
@app.post("/login/")
async def login(user: UserLogin):
    try:
        # Check if the user exists in the database
        db_user = collection.find_one({"email": user.email})
        if not db_user:
            logger.debug(user.email)
            raise HTTPException(status_code=400, detail="Invalid email or password")


        # Verify the password
        if not pwd_context.verify(user.password, db_user['password']):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Generate the token
        access_token_expires = timedelta(hours=1)
        access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
        
        return {"access_token": access_token, "token_type": "bearer", "userName": db_user.get('userName'), "email": db_user.get('email'), "type": db_user.get('type')}

    except Exception as e:
        logging.error(f"Error during login: {e}")
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
    

from fastapi import HTTPException
from bson.objectid import ObjectId

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






# @app.post("/sign-up/")
# async def sign_up(sign_up_request: SignUpRequest):
#     try:
#         # Check if the email already exists in the database
#         existing_user = collection.find_one({"email": sign_up_request.email})
#         if existing_user:
#             raise HTTPException(status_code=400, detail="Email already registered")

#         # Create a new user document with the provided data (no hashing)
#         user_data = {
#             "Uid": str(ObjectId()),
#             "userName": sign_up_request.userName,
#             "email": sign_up_request.email,
#             "password": sign_up_request.password,  # Use plain text password as per requirement
#             "type": "employee",  # Default to employee for new users
#         }

#         # Insert the new user into the database
#         collection.insert_one(user_data)

#         return {"message": "User created successfully", "type": "employee"}
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

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


