# Memory management for multi-turn conversations
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class ConversationMemory:
    """Manages conversation history with size limits to prevent memory issues"""
    
    def __init__(self, max_messages: int = 10):
        """Initialize conversation memory with a max message limit
        
        Args:
            max_messages: Maximum number of messages to keep in memory
        """
        if max_messages < 2 or max_messages > 100:
            raise ValueError("max_messages must be between 2 and 100")
        self.max_messages = max_messages
        self.messages: List[Dict[str, str]] = []
    
    def add_message(self, role: str, content: str):
        """Add a message to memory and enforce size limit
        
        Args:
            role: Either 'user' or 'assistant'
            content: The message content
        """
        if not content or not isinstance(content, str):
            logger.warning("Skipping invalid message")
            return
        
        if role not in ("user", "assistant"):
            logger.warning(f"Skipping message with invalid role: {role}")
            return
        
        self.messages.append({
            "role": role, 
            "content": content.strip()
        })
        
        # keep only recent messages to prevent memory bloat
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
            logger.debug(f"Trimmed conversation history to {self.max_messages} messages")
    
    def get_messages(self) -> List[Dict[str, str]]:
        """Get all stored messages
        
        Returns:
            List of message dictionaries with role and content
        """
        return [msg.copy() for msg in self.messages]
    
    def get_last_n(self, n: int) -> List[Dict[str, str]]:
        """Get last N messages
        
        Args:
            n: Number of recent messages to retrieve
            
        Returns:
            List of last N messages
        """
        if n <= 0:
            return []
        return [msg.copy() for msg in self.messages[-n:]]
    
    def clear(self):
        """Clear all messages"""
        self.messages.clear()
        logger.debug("Conversation memory cleared")
    
    def __len__(self) -> int:
        """Get the number of messages in memory"""
        return len(self.messages)
    
    def __repr__(self) -> str:
        return f"ConversationMemory(messages={len(self.messages)}, max={self.max_messages})"
