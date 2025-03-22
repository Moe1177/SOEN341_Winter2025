# AWS S3 Storage Setup for SOEN341

This guide explains how to set up AWS S3 storage for file attachments in the SOEN341 messaging application.

## Prerequisites

- AWS Account
- AWS CLI installed and configured on your machine
- Java 17 or higher
- Maven

## Setting Up AWS S3

1. **Create an AWS Account**

   - If you don't have an AWS account, create one at [https://aws.amazon.com/](https://aws.amazon.com/)

2. **Install AWS CLI**

   - Follow the instructions at [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
   - Configure AWS CLI with your credentials:
     ```
     aws configure
     ```
     You'll need to provide:
     - AWS Access Key ID
     - AWS Secret Access Key
     - Default region
     - Default output format (json recommended)

3. **Create an S3 Bucket**
   - You can create a bucket manually through the AWS Console or use our deployment script:
     ```
     chmod +x deploy-s3-storage.sh
     ./deploy-s3-storage.sh
     ```
   - The script will guide you through creating a bucket and configuring it for the application.

## Configuration

### Manual Configuration

If you're not using the deployment script, you'll need to:

1. **Set Environment Variables**

   - `AWS_S3_BUCKET_NAME`: Your S3 bucket name
   - `AWS_S3_REGION`: AWS region where your bucket is located (e.g., us-east-1)
   - `SPRING_PROFILES_ACTIVE`: Set to `prod` to enable S3 storage

2. **Update application-prod.properties**
   - Ensure `aws.s3.enabled=true` is set in the configuration

### AWS IAM Policy

Ensure your AWS user has the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

## Running the Application with S3 Storage

1. **Build the application**

   ```
   mvn clean package
   ```

2. **Run with S3 Storage enabled**
   ```
   java -jar target/soen341-backend.jar --spring.profiles.active=prod
   ```

## Testing S3 Storage

1. **Upload a file attachment** through the application
2. **Verify in AWS Console** that the file appears in your S3 bucket
3. **Download the attachment** through the application to verify retrieval works

## Troubleshooting

- **Access Denied**: Check IAM permissions and bucket policy
- **NoSuchBucket**: Verify bucket name and region are correct
- **Connection Issues**: Ensure your application can connect to AWS (no firewall blocking)

## Switching Back to Local Storage

To switch back to local storage:

1. Set `aws.s3.enabled=false` in your configuration
2. Run with the default profile: `java -jar target/soen341-backend.jar`
