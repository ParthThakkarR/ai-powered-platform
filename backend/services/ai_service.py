import json
import re
import openai
from core.config import settings

openai.api_key = settings.OPENAI_API_KEY


def generate_tasks_from_description(description: str):
    """
    Generates a list of tasks based on a project description.
    Uses OpenAI if API key is set, otherwise generates smart mock tasks
    based on keyword analysis of the description.
    """
    if not settings.OPENAI_API_KEY:
        return _generate_smart_mock_tasks(description)

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
        return _generate_smart_mock_tasks(description)


def _generate_smart_mock_tasks(description: str):
    """
    Generates context-aware mock tasks by analyzing keywords in the description.
    This runs when no OpenAI API key is configured.
    """
    desc_lower = description.lower()
    tasks = []

    # Always start with a requirements/planning task
    tasks.append({
        "title": f"Define requirements for: {description[:60]}",
        "description": f"Gather and document all functional and non-functional requirements. Identify stakeholders, define acceptance criteria, and create user stories based on: {description[:200]}",
        "priority": "HIGH"
    })

    # Backend / API tasks
    if any(kw in desc_lower for kw in ["api", "backend", "server", "endpoint", "rest", "graphql", "fastapi", "django", "flask"]):
        tasks.append({
            "title": "Design and implement REST API endpoints",
            "description": "Create API route handlers, request/response schemas, input validation, error handling, and write OpenAPI documentation for all endpoints.",
            "priority": "HIGH"
        })
        tasks.append({
            "title": "Implement authentication and authorization middleware",
            "description": "Set up JWT-based auth, role-based access control, rate limiting, and secure session management for API endpoints.",
            "priority": "HIGH"
        })

    # Database tasks
    if any(kw in desc_lower for kw in ["database", "db", "schema", "sql", "data", "model", "store", "storage", "migrate"]):
        tasks.append({
            "title": "Design database schema and migrations",
            "description": "Create entity-relationship diagrams, define SQLAlchemy models, write Alembic migration scripts, and set up indexing for query performance.",
            "priority": "HIGH"
        })

    # Frontend / UI tasks
    if any(kw in desc_lower for kw in ["frontend", "ui", "ux", "react", "page", "dashboard", "interface", "component", "form", "button"]):
        tasks.append({
            "title": "Build responsive UI components",
            "description": "Create reusable React components with proper state management, responsive layouts, accessibility (ARIA), and consistent design system styling.",
            "priority": "HIGH"
        })
        tasks.append({
            "title": "Implement form validation and user feedback",
            "description": "Add client-side validation with helpful error messages, loading states, success/error toasts, and optimistic UI updates.",
            "priority": "MEDIUM"
        })

    # Payment / billing tasks
    if any(kw in desc_lower for kw in ["payment", "stripe", "billing", "subscription", "checkout", "invoice", "pricing"]):
        tasks.append({
            "title": "Integrate payment gateway (Stripe)",
            "description": "Set up Stripe SDK, implement checkout sessions, handle payment intents, store payment records, and build a billing dashboard for users.",
            "priority": "URGENT"
        })
        tasks.append({
            "title": "Implement subscription management",
            "description": "Build plan selection UI, handle recurring billing webhooks, manage plan upgrades/downgrades, and implement grace periods for failed payments.",
            "priority": "HIGH"
        })
        tasks.append({
            "title": "Handle Stripe webhook events",
            "description": "Create secure webhook endpoint to process payment_intent.succeeded, invoice.paid, customer.subscription.updated, and charge.failed events.",
            "priority": "HIGH"
        })

    # Authentication tasks
    if any(kw in desc_lower for kw in ["auth", "login", "signup", "register", "oauth", "sso", "password"]):
        tasks.append({
            "title": "Build user authentication flow",
            "description": "Implement login, registration, password reset, email verification, and OAuth social login (Google/GitHub) with secure token handling.",
            "priority": "HIGH"
        })

    # Testing tasks
    if any(kw in desc_lower for kw in ["test", "testing", "qa", "quality", "unit", "integration", "e2e"]):
        tasks.append({
            "title": "Write comprehensive test suite",
            "description": "Create unit tests for business logic, integration tests for API endpoints, and end-to-end tests for critical user flows. Target 80%+ code coverage.",
            "priority": "MEDIUM"
        })

    # Deployment tasks
    if any(kw in desc_lower for kw in ["deploy", "devops", "ci/cd", "docker", "cloud", "aws", "production", "hosting"]):
        tasks.append({
            "title": "Set up CI/CD pipeline and deployment",
            "description": "Configure GitHub Actions for automated testing, Docker containerization, staging/production environments, and zero-downtime deployment strategy.",
            "priority": "MEDIUM"
        })

    # Notification tasks
    if any(kw in desc_lower for kw in ["notification", "email", "sms", "alert", "push", "webhook"]):
        tasks.append({
            "title": "Implement notification system",
            "description": "Build email notification service with templates, in-app notifications with real-time updates, and optional SMS/push notification channels.",
            "priority": "MEDIUM"
        })

    # Search tasks
    if any(kw in desc_lower for kw in ["search", "filter", "sort", "query", "find"]):
        tasks.append({
            "title": "Build search and filtering system",
            "description": "Implement full-text search with filters, sorting, pagination, and autocomplete suggestions for an efficient data discovery experience.",
            "priority": "MEDIUM"
        })

    # If no specific keywords matched, add generic software engineering tasks
    if len(tasks) <= 1:
        tasks.extend([
            {
                "title": f"Design system architecture for: {description[:50]}",
                "description": f"Create technical design document covering system components, data flow, API contracts, and technology stack decisions for: {description[:200]}",
                "priority": "HIGH"
            },
            {
                "title": "Implement core business logic",
                "description": f"Build the main feature logic based on requirements: {description[:200]}. Include proper error handling, logging, and input validation.",
                "priority": "HIGH"
            },
            {
                "title": "Build user-facing interface",
                "description": "Create intuitive UI with responsive design, loading states, error boundaries, and smooth transitions for the best user experience.",
                "priority": "HIGH"
            },
            {
                "title": "Set up database and data layer",
                "description": "Design database schema, create ORM models, write migrations, and implement repository pattern for clean data access.",
                "priority": "MEDIUM"
            },
        ])

    # Always end with testing and documentation
    tasks.append({
        "title": "Write tests and documentation",
        "description": "Create unit tests, API documentation, README with setup instructions, and inline code comments for maintainability.",
        "priority": "MEDIUM"
    })

    tasks.append({
        "title": "Code review and performance optimization",
        "description": "Conduct thorough code review, fix security vulnerabilities, optimize database queries, add caching where needed, and ensure production readiness.",
        "priority": "LOW"
    })

    return tasks


def analyze_bug_trace(error_log: str):
    """
    Analyzes an error log and suggests fixes.
    Uses OpenAI if available, otherwise provides smart mock analysis.
    """
    if not settings.OPENAI_API_KEY:
        return _generate_smart_bug_analysis(error_log)

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
        return _generate_smart_bug_analysis(error_log)


def _generate_smart_bug_analysis(error_log: str):
    """
    Generates a context-aware mock bug analysis by pattern-matching common errors.
    """
    log_lower = error_log.lower()
    analysis_parts = []

    analysis_parts.append("🔍 **AI Bug Analysis Report**\n")

    # TypeError
    if "typeerror" in log_lower:
        if "undefined" in log_lower or "null" in log_lower:
            analysis_parts.append("**Root Cause:** TypeError — Attempting to access a property or call a method on `undefined` or `null`.\n")
            analysis_parts.append("**Explanation:** A variable that was expected to hold an object/array is actually `undefined` or `null`. This commonly happens when:\n- An API response hasn't loaded yet\n- A state variable hasn't been initialized\n- An object key is misspelled\n")
            analysis_parts.append("**Suggested Fixes:**\n1. Add optional chaining: `obj?.property?.nested`\n2. Add a null check before accessing: `if (obj) { ... }`\n3. Provide a default value: `const val = obj ?? defaultValue`\n4. Check your API response structure matches what you expect\n")
        else:
            analysis_parts.append("**Root Cause:** TypeError — Type mismatch in operation.\n")
            analysis_parts.append("**Suggested Fixes:**\n1. Verify variable types with `typeof` or `instanceof`\n2. Add type guards or validation before the operation\n3. Check function signatures match the arguments passed\n")

    # SyntaxError
    elif "syntaxerror" in log_lower:
        analysis_parts.append("**Root Cause:** SyntaxError — Invalid code structure detected by the parser.\n")
        analysis_parts.append("**Suggested Fixes:**\n1. Check for missing brackets, parentheses, or semicolons\n2. Look for invalid JSON if parsing data\n3. Verify template literal syntax\n4. Run a linter (ESLint/Prettier) to highlight the exact location\n")

    # Network / Connection errors
    elif any(kw in log_lower for kw in ["network", "econnrefused", "fetch", "cors", "connection refused", "timeout"]):
        analysis_parts.append("**Root Cause:** Network/Connection Error — The application cannot reach the target server.\n")
        analysis_parts.append("**Explanation:** The request failed at the transport layer, not the application layer.\n")
        analysis_parts.append("**Suggested Fixes:**\n1. Verify the backend server is running on the expected port\n2. Check CORS configuration allows your frontend origin\n3. Ensure the API URL is correct (no typos, correct protocol)\n4. Check firewall/proxy settings\n5. For CORS: add `Access-Control-Allow-Origin` headers on the server\n")

    # 500 / Internal Server Error
    elif "500" in error_log or "internal server error" in log_lower:
        analysis_parts.append("**Root Cause:** Internal Server Error (500) — Unhandled exception on the backend.\n")
        analysis_parts.append("**Suggested Fixes:**\n1. Check backend logs for the full stack trace\n2. Look for database connection issues or query errors\n3. Verify all required environment variables are set\n4. Add try/except blocks with proper error responses\n5. Check if a database migration is pending\n")

    # Import errors
    elif "importerror" in log_lower or "modulenotfound" in log_lower:
        analysis_parts.append("**Root Cause:** ImportError/ModuleNotFoundError — A required module cannot be found.\n")
        analysis_parts.append("**Suggested Fixes:**\n1. Install the missing package: `pip install <package>` or `npm install <package>`\n2. Check for typos in the import path\n3. Verify you're in the correct virtual environment\n4. Check if the module was renamed or deprecated\n")

    # KeyError / AttributeError
    elif "keyerror" in log_lower or "attributeerror" in log_lower:
        analysis_parts.append("**Root Cause:** KeyError/AttributeError — Accessing a non-existent key or attribute.\n")
        analysis_parts.append("**Suggested Fixes:**\n1. Use `.get()` with a default value for dictionaries\n2. Check the data structure with print/logging before access\n3. Verify API response schema hasn't changed\n4. Add hasattr() checks for dynamic attributes\n")

    # Generic fallback
    else:
        analysis_parts.append(f"**Error Log Received:**\n```\n{error_log[:500]}\n```\n")
        analysis_parts.append("**General Analysis:**\n")
        analysis_parts.append("1. Check the line number in the stack trace to locate the exact failure point\n")
        analysis_parts.append("2. Add logging/print statements around the failing code\n")
        analysis_parts.append("3. Verify all inputs and dependencies are correctly initialized\n")
        analysis_parts.append("4. Search the error message in the project's issue tracker or Stack Overflow\n")
        analysis_parts.append("5. Run in debug mode to step through the failing code path\n")

    analysis_parts.append("\n---\n💡 *For deeper AI-powered analysis, set `OPENAI_API_KEY` in your `.env` file.*")

    return "\n".join(analysis_parts)
