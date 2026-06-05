import json
import openai
from core.config import settings

openai.api_key = settings.OPENAI_API_KEY

def generate_tasks_from_description(description: str):
    """
    Calls OpenAI to generate a list of tasks based on a project description.
    """
    if not settings.OPENAI_API_KEY:
        # Mock response if no key is provided
        return [
            {"title": "Setup Frontend", "description": "Initialize React app", "priority": "HIGH"},
            {"title": "Setup Backend", "description": "Initialize FastAPI app", "priority": "HIGH"},
            {"title": "Database Schema", "description": "Design database", "priority": "MEDIUM"}
        ]
        
    prompt = f"""
    You are an expert technical project manager. Based on the following project description, generate a list of software engineering tasks.
    Format the output as a valid JSON array of objects. 
    Each object must have the following keys: 'title' (string), 'description' (string), 'priority' (string: LOW, MEDIUM, HIGH, URGENT).
    
    Project Description:
    {description}
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful project manager."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return []

def analyze_bug_trace(error_log: str):
    """
    Calls OpenAI to analyze an error log and suggest fixes.
    """
    if not settings.OPENAI_API_KEY:
        return "Please set the OPENAI_API_KEY in the environment to use AI Bug Analysis."
        
    prompt = f"""
    You are a Senior Staff Software Engineer. Analyze the following error log or stack trace.
    Provide the root cause, a brief debugging explanation, and possible fixes.
    
    Error Log:
    {error_log}
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert debugging assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return str(e)
