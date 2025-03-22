#!/bin/bash

# Script to set up and deploy the application with AWS S3 storage

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    echo "Follow instructions at: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are set up
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials are not set up or are invalid."
    echo "Please run 'aws configure' to set up your credentials."
    exit 1
fi

# Get AWS S3 bucket name
read -p "Enter the AWS S3 bucket name: " BUCKET_NAME

# Get AWS region
read -p "Enter the AWS region (e.g., us-east-1): " REGION

# Create AWS S3 bucket if it doesn't exist
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating S3 bucket: $BUCKET_NAME in region $REGION"
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
    
    # Set bucket policy to allow public read access for attachments
    echo "Setting bucket public read access policy..."
    cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForGetBucketObjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json
    rm bucket-policy.json
fi

# Create .env file with AWS configuration
echo "Creating .env file with AWS configuration..."
cat > .env << EOF
AWS_S3_BUCKET_NAME=$BUCKET_NAME
AWS_S3_REGION=$REGION
SPRING_PROFILES_ACTIVE=prod
EOF

echo "Configuration complete. You can now build and deploy the application."
echo "To start with AWS S3 storage enabled, use:"
echo "java -jar target/soen341-backend.jar --spring.profiles.active=prod" 