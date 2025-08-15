import openai
import time
import json
import hashlib
from typing import Dict, Any, Optional
from app.config import config
from app.db.enums import TaskPriority
from app.utils.logger import logger

class OpenAIService:
    def __init__(self):
        # Set OpenAI API key and organization (if available)
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required in config")

        # Initialize cache for responses
        self._cache = {}

        # For newer OpenAI library versions (v1.0+), use the client approach
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=config.OPENAI_API_KEY,
                organization=getattr(config, 'OPENAI_ORG_ID', None),
                timeout=getattr(config, 'OPENAI_TIMEOUT', 30)
            )
            self._use_client = True
            logger.info("Using OpenAI client v1.0+")
        except ImportError:
            # Fallback to legacy API
            openai.api_key = config.OPENAI_API_KEY
            if hasattr(config, 'OPENAI_ORG_ID') and config.OPENAI_ORG_ID:
                openai.organization = config.OPENAI_ORG_ID
            self._use_client = False
            logger.info("Using OpenAI legacy API")

    def _generate_block_id(self) -> str:
        """Generate unique block ID"""
        return f"block-{int(time.time() * 1000)}-{hash(time.time()) % 10000}"

    def _create_fallback_blocks(self, content: str = "") -> str:
        """Create fallback blocks when AI response fails"""
        fallback_blocks = [
            {
                "id": self._generate_block_id(),
                "type": "paragraph",
                "content": content or "Click here to start writing your task description...",
                "position": 0
            }
        ]
        return json.dumps(fallback_blocks)

    def _validate_blocks(self, blocks: Any) -> bool:
        """Validate blocks structure"""
        if not isinstance(blocks, list) or len(blocks) == 0:
            return False

        for block in blocks:
            if not isinstance(block, dict):
                return False

            required_fields = ['id', 'type', 'content', 'position']
            if not all(field in block for field in required_fields):
                return False

            # Validate block type
            valid_types = ['paragraph', 'heading1', 'heading2',
                           'heading3', 'quote', 'code', 'bulletList', 'numberedList']
            if block['type'] not in valid_types:
                return False

            # Validate position is a number
            if not isinstance(block['position'], (int, float)):
                return False

            # Validate content is string
            if not isinstance(block.get('content'), str):
                return False

            # Validate id is string
            if not isinstance(block.get('id'), str):
                return False

        return True

    def _get_cache_key(self, title: str, context: Optional[Dict] = None, user_requirements: Optional[str] = None) -> str:
        """Generate cache key for request"""
        content = f"{title}:{json.dumps(context, sort_keys=True) if context else ''}:{user_requirements or ''}"
        return hashlib.md5(content.encode()).hexdigest()

    def _clean_cache(self):
        """Clean expired cache entries"""
        current_time = time.time()
        cache_ttl = getattr(config, 'CACHE_TTL_SECONDS', 3600)

        expired_keys = [
            key for key, (timestamp, _) in self._cache.items()
            if current_time - timestamp > cache_ttl
        ]

        for key in expired_keys:
            del self._cache[key]

    async def _make_openai_request(self, messages: list, model: str = "gpt-4", max_tokens: int = 2000, temperature: float = 0.7):
        """Make OpenAI API request with proper error handling"""
        try:
            if self._use_client:
                # Use new client API (v1.0+)
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content
            else:
                # Use legacy API
                response = openai.ChatCompletion.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content

        except Exception as e:
            # Handle different OpenAI exceptions
            error_msg = str(e).lower()

            if "rate limit" in error_msg or "429" in str(e):
                logger.error(f"OpenAI rate limit exceeded: {e}")
                raise Exception(
                    "AI service is currently busy. Please try again in a moment.")
            elif "authentication" in error_msg or "invalid api key" in error_msg or "401" in str(e):
                logger.error(f"OpenAI authentication error: {e}")
                raise Exception(
                    "AI service authentication failed. Please check configuration.")
            elif "model" in error_msg and "does not exist" in error_msg:
                logger.error(f"OpenAI model error: {e}")
                raise Exception(
                    "The requested AI model is not available. Please try again.")
            elif "timeout" in error_msg:
                logger.error(f"OpenAI timeout error: {e}")
                raise Exception(
                    "AI service request timed out. Please try again.")
            elif "400" in str(e) or "bad request" in error_msg:
                logger.error(f"OpenAI bad request: {e}")
                raise Exception(
                    "Invalid request to AI service. Please try again.")
            elif "500" in str(e) or "internal server error" in error_msg:
                logger.error(f"OpenAI server error: {e}")
                raise Exception(
                    "AI service is experiencing issues. Please try again later.")
            else:
                logger.error(f"Unexpected OpenAI error: {e}")
                raise Exception("AI service is temporarily unavailable.")

    def _sanitize_input(self, text: str, max_length: int = 1000) -> str:
        """Sanitize user input"""
        if not text:
            return ""

        # Remove potentially harmful content
        sanitized = text.strip()

        # Limit length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length] + "..."

        # Remove control characters
        sanitized = ''.join(char for char in sanitized if ord(
            char) >= 32 or char in '\n\r\t')

        return sanitized

    def _sanitize_blocks(self, blocks: list) -> list:
        """Sanitize and ensure proper block structure"""
        sanitized_blocks = []

        for i, block in enumerate(blocks):
            # Sanitize content
            content = self._sanitize_input(
                str(block.get('content', '')), max_length=2000)

            sanitized_block = {
                "id": block.get('id', self._generate_block_id()),
                "type": block.get('type', 'paragraph'),
                "content": content,
                "position": i
            }

            # Ensure valid block type
            valid_types = ['paragraph', 'heading1', 'heading2',
                           'heading3', 'quote', 'code', 'bulletList', 'numberedList']
            if sanitized_block['type'] not in valid_types:
                sanitized_block['type'] = 'paragraph'

            sanitized_blocks.append(sanitized_block)

        return sanitized_blocks

    def _clean_response_content(self, content: str) -> str:
        """Clean OpenAI response content"""
        if not content:
            return ""

        # Remove markdown formatting
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]

        # Remove common prefixes/suffixes
        prefixes_to_remove = [
            "Here is the JSON:",
            "Here's the task description:",
            "The task description in JSON format:",
        ]

        for prefix in prefixes_to_remove:
            if content.lower().startswith(prefix.lower()):
                content = content[len(prefix):]
                break

        return content.strip()

    async def generate_task_description(
        self,
        title: str,
        context: Optional[Dict[str, Any]] = None,
        user_requirements: Optional[str] = None
    ) -> str:
        """
        Generate task description using OpenAI based on title and context
        """
        try:
            # Input validation and sanitization
            if not title or not title.strip():
                raise ValueError("Task title is required")

            title = self._sanitize_input(title.strip(), max_length=200)
            user_requirements = self._sanitize_input(
                user_requirements, max_length=1000) if user_requirements else None

            # Check cache first
            cache_key = self._get_cache_key(title, context, user_requirements)
            self._clean_cache()

            if cache_key in self._cache:
                cached_time, result = self._cache[cache_key]
                cache_ttl = getattr(config, 'CACHE_TTL_SECONDS', 3600)
                if time.time() - cached_time < cache_ttl:
                    logger.info(f"Returning cached result for task: {title}")
                    return result

            # Build context information
            context_info = ""
            if context:
                project_name = context.get('project_name', '')
                priority = context.get('priority', '')
                existing_tasks = context.get('existing_tasks', [])

                if project_name:
                    context_info += f"Project: {self._sanitize_input(project_name, 100)}\n"
                if priority and priority != TaskPriority.NO_PRIORITY.value:
                    context_info += f"Priority: {priority}\n"
                if existing_tasks:
                    sanitized_tasks = [self._sanitize_input(task, 100) for task in existing_tasks[:3]]
                    context_info += f"Related Tasks: {', '.join(sanitized_tasks)}\n"

            context_block = f"Context:\n{context_info}" if context_info else ""
            requirements_block = f"Additional Requirements: {user_requirements}" if user_requirements else ""

            # Use timestamp for unique IDs in prompt
            timestamp = int(time.time() * 1000)

            # Build the prompt with better structure
            prompt = f"""
            You are an expert project manager creating detailed task descriptions. Generate a task description in JSON block format for a modern block editor.

            Task Title: "{title}"
            {context_block}
            {requirements_block}

            Create a comprehensive task description with the following structure:
            1. Brief overview paragraph explaining what needs to be done
            2. "Acceptance Criteria" heading
            3. 3-5 specific acceptance criteria as bullet points
            4. Optional: "Technical Notes" or "Implementation Details" heading if technical
            5. Optional: Include CODE BLOCKS for technical implementation examples
            6. Optional: Include QUOTES for important notes or best practices
            7. Optional: Additional bullet points or paragraphs as needed

            CRITICAL: Return ONLY a valid JSON array of blocks. No markdown, no explanations, no additional text.

            Format example with code and quotes:
            [
            {{"id": "block-{timestamp}", "type": "paragraph", "content": "Clear overview of the task...", "position": 0}},
            {{"id": "block-{timestamp + 1}", "type": "heading2", "content": "Acceptance Criteria", "position": 1}},
            {{"id": "block-{timestamp + 2}", "type": "bulletList", "content": "First specific criterion", "position": 2}},
            {{"id": "block-{timestamp + 3}", "type": "heading2", "content": "Implementation Example", "position": 3}},
            {{"id": "block-{timestamp + 4}", "type": "code", "content": "// Example code snippet\\nfunction example() {{\\n  return 'implementation';\\n}}", "position": 4}},
            {{"id": "block-{timestamp + 5}", "type": "quote", "content": "Important: Remember to follow security best practices", "position": 5}}
            ]

            Available block types: paragraph, heading1, heading2, heading3, quote, code, bulletList, numberedList

            Guidelines for code/quote usage:
            - Use CODE blocks for: technical implementation examples, configuration snippets, API endpoints, SQL queries
            - Use QUOTE blocks for: important warnings, best practices, key reminders, stakeholder requirements
            - Keep code examples concise and relevant to the task
            - Make quotes actionable and meaningful

            Requirements:
            - Each bullet point must be specific and measurable
            - Content should be professional and actionable
            - Include realistic acceptance criteria
            - Include code examples when task is technical
            - Include quotes for important notes or warnings
            - Keep content concise but comprehensive
            """

            content = await self._make_openai_request(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert project manager. Generate structured task descriptions in JSON block format. Return ONLY valid JSON arrays with no additional text, markdown, or formatting."
                    },
                    {"role": "user", "content": prompt}
                ],
                model=getattr(config, 'OPENAI_DEFAULT_MODEL', 'gpt-4'),
                max_tokens=getattr(config, 'OPENAI_MAX_TOKENS', 2000),
                temperature=getattr(config, 'OPENAI_TEMPERATURE', 0.7)
            )

            # Clean response content
            content = self._clean_response_content(content)

            # Try to parse the JSON response
            try:
                blocks = json.loads(content)

                if self._validate_blocks(blocks):
                    # Sanitize and ensure proper structure
                    sanitized_blocks = self._sanitize_blocks(blocks)
                    result = json.dumps(sanitized_blocks)

                    # Cache the result
                    self._cache[cache_key] = (time.time(), result)

                    logger.info(
                        f"Successfully generated task description for: {title}")
                    return result
                else:
                    logger.warning(
                        f"Invalid block structure from OpenAI: {content[:200]}...")
                    return self._create_fallback_blocks(f"Task: {title}\n\nGenerate detailed description here...")

            except json.JSONDecodeError as e:
                logger.warning(
                    f"Failed to parse OpenAI response as JSON: {e}\nContent preview: {content[:200]}...")
                # Try to extract meaningful content and create blocks
                return self._create_fallback_blocks(content if len(content) < 500 else f"Task: {title}\n\nGenerate detailed description here...")

        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Error generating task description: {str(e)}")
            return self._create_fallback_blocks(f"Task: {title}\n\nPlease add a detailed description for this task.")


# Create singleton instance
openai_service = OpenAIService()
