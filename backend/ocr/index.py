import json
import base64
import re
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Распознавание текста "Альфа" или "Омега" из изображения
    Args: event - dict с httpMethod, body (base64 изображение)
          context - объект с request_id, function_name
    Returns: HTTP response dict с распознанным значением
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '{}' or body_str.strip() == '':
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Image data required'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(body_str)
        image_base64 = body_data.get('image', '')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Image data required'}),
                'isBase64Encoded': False
            }
        
        image_bytes = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        
        try:
            from PIL import Image
            import pytesseract
            import io
            
            image = Image.open(io.BytesIO(image_bytes))
            
            text = pytesseract.image_to_string(image, lang='rus+eng')
            text_clean = text.lower().strip()
            
            detected_value = None
            if re.search(r'альфа|alpha|а.*л.*ь.*ф.*а', text_clean, re.IGNORECASE):
                detected_value = 'Альфа'
            elif re.search(r'омега|omega|о.*м.*е.*г.*а', text_clean, re.IGNORECASE):
                detected_value = 'Омега'
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'value': detected_value,
                    'raw_text': text,
                    'confidence': 'high' if detected_value else 'low'
                }),
                'isBase64Encoded': False
            }
            
        except ImportError:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'value': None,
                    'raw_text': 'OCR libraries not available',
                    'confidence': 'none',
                    'note': 'Install Pillow, pytesseract, and tesseract-ocr'
                }),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }