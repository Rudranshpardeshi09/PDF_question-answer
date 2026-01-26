# from fastapi import APIRouter, UploadFile, File
# from app.services.syllabus_service import parse_syllabus

# router = APIRouter(prefix="/syllabus", tags=["Syllabus"])

# SYLLABUS_STORE = {}

# @router.post("/upload")
# async def upload_syllabus(file: UploadFile = File(...)):
#     content = (await file.read()).decode("utf-8")
#     parsed = parse_syllabus(content)

#     SYLLABUS_STORE.clear()
#     SYLLABUS_STORE.update(parsed)

#     return {
#         "units": list(parsed.keys()),
#         "topics": parsed
#     }
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.syllabus_service import parse_syllabus

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])


@router.post("/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    """
    Upload and parse syllabus (PDF or DOCX).
    
    Returns:
    {
        "subject": "Subject Name",
        "units": [
            {
                "name": "Unit I",
                "topics": ["topic1", "topic2", ...],
                "format": "long|medium|short"
            },
            ...
        ]
    }
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate file type
    allowed_types = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Only PDF and DOCX files are allowed"
        )

    try:
        parsed_syllabus = parse_syllabus(file)
        return parsed_syllabus
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing syllabus: {str(e)}")
