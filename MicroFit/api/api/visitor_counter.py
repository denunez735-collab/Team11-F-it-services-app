import json
import os

import boto3
from botocore.exceptions import ClientError

COUNTER_TABLE = os.environ.get('VISITOR_TABLE', 'MicroFitVisitorCounter')

client = boto3.resource('dynamodb')


def lambda_handler(event, context):
    """AWS Lambda handler for incrementing the visitor counter."""
    table = client.Table(COUNTER_TABLE)

    try:
        response = table.update_item(
            Key={'counterId': 'visitor'},
            UpdateExpression='SET #count = if_not_exists(#count, :start) + :inc',
            ExpressionAttributeNames={'#count': 'count'},
            ExpressionAttributeValues={':inc': 1, ':start': 0},
            ReturnValues='UPDATED_NEW'
        )

        count = int(response['Attributes']['count'])
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
            'body': json.dumps({'visitorCount': count})
        }

    except ClientError as error:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'error': 'Unable to update visitor count',
                'details': str(error)
            })
        }
