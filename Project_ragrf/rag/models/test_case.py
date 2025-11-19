"""
Test case model and schema definitions
"""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class TestCase:
    """Test case model representing the structure of test cases"""
    test_case_id: str = ""
    reference_documents: Dict[str, str] = field(default_factory=dict)
    description: str = ""
    steps: List[Dict[str, str]] = field(default_factory=list)
    expected_results: List[str] = field(default_factory=list)
    priority: str = "Medium"
    complexity: str = "Medium"
    regression: str = "N"
    automated: str = "N"
    test_type: str = "Manual"
    author: str = ""
    condition: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert test case to dictionary"""
        return {
            "test_case_id": self.test_case_id,
            "reference_documents": self.reference_documents,
            "description": self.description,
            "steps": self.steps,
            "expected_results": self.expected_results,
            "priority": self.priority,
            "complexity": self.complexity,
            "regression": self.regression,
            "automated": self.automated,
            "test_type": self.test_type,
            "author": self.author,
            "condition": self.condition
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TestCase':
        """Create test case from dictionary"""
        return cls(
            test_case_id=data.get("test_case_id", ""),
            reference_documents=data.get("reference_documents", {}),
            description=data.get("description", ""),
            steps=data.get("steps", []),
            expected_results=data.get("expected_results", []),
            priority=data.get("priority", "Medium"),
            complexity=data.get("complexity", "Medium"),
            regression=data.get("regression", "N"),
            automated=data.get("automated", "N"),
            test_type=data.get("test_type", "Manual"),
            author=data.get("author", ""),
            condition=data.get("condition", "")
        )
