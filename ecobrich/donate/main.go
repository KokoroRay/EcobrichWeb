package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DonateRequest struct {
	UserID string  `json:"user_id"`
	Weight float64 `json:"weight"` // số kg nhựa
}

var dbClient *dynamodb.Client

func init() {
	// Khởi tạo SDK ngoài handler để tận dụng "Lambda Execution Context reuse"
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}
	dbClient = dynamodb.NewFromConfig(cfg)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req DonateRequest
	err := json.Unmarshal([]byte(request.Body), &req)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: "Invalid request body"}, nil
	}

	points := int(req.Weight * 10) // Quy đổi: 1kg = 10 điểm
	tableName := "UserProfiles"    // Tên bảng DynamoDB của bạn

	// 1. Atomic Update: Cộng dồn điểm vào Profile User
	_, err = dbClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"UserID": &types.AttributeValueMemberS{Value: req.UserID},
		},
		// Sử dụng ADD để tự động cộng dồn (Atomic Counter)
		UpdateExpression: aws.String("ADD TotalPoints :p"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":p": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", points)},
		},
	})

	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: "Error updating points"}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       fmt.Sprintf("Thành công! Bạn nhận được %d điểm.", points),
	}, nil
}

func main() {
	lambda.Start(handler)
}
