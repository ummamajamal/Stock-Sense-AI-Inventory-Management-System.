# StockSense AI Inventory Management System

## Project Overview

StockSense is an AI powered inventory management system designed for small and medium sized retail businesses, stores, and shopping malls. The system was developed to solve common inventory management problems faced by businesses that still depend on paper registers, manual calculations, spreadsheets, or informal communication through platforms such as WhatsApp.

The main purpose of StockSense is to provide one centralized system where products, stock quantities, stock movements, low stock conditions, user access, and inventory related questions can be managed efficiently.

The system combines traditional inventory management with artificial intelligence. Users can continue performing normal inventory operations through forms while the AI assistant provides a faster way to understand and interact with actual inventory data.

## Problem Statement

Many small businesses do not have a proper centralized inventory system. Staff members may record incoming and outgoing stock manually, making it difficult to determine the current quantity of a product accurately. Records can become outdated, duplicate entries may occur, and finding historical stock information can take significant time.

Another common problem is that business owners and managers need quick answers about their inventory but may have to manually search through records to find the required information.

StockSense addresses these problems by maintaining structured digital inventory records and providing an AI assistant that can interact with those records.

## Main Objectives

The main objectives of StockSense are to digitize inventory management, reduce manual record keeping, improve stock accuracy, provide controlled access to business information, identify products that require restocking, and make inventory information easier to understand through AI.

The system is designed around an important principle: AI should assist users without taking uncontrolled actions on business data.

## User Roles

StockSense contains two primary user roles: Staff and Manager.

### Staff

Staff members are responsible for regular inventory operations. They can view available products, record incoming stock, record outgoing stock, view relevant stock information, and use the AI assistant for permitted inventory questions.

Staff members cannot access sensitive business information such as product cost, profit, or other manager restricted information.

### Manager

Managers have broader access to the inventory system. They can monitor overall stock conditions, review stock history, identify low stock products, access management level information, and use the AI assistant for broader inventory analysis.

The backend determines the user's actual role instead of relying on frontend information. This prevents users from simply changing a frontend value to gain unauthorized permissions.

## Product Management

StockSense maintains structured product records containing important information such as product name, category, available quantity, reorder level, and other relevant inventory information.

Products can represent different types of items commonly found in a shopping mall or retail environment, including groceries, electronics, clothing, household products, and accessories.

The centralized product database ensures that the application works with the same source of truth across different features.

## Stock In

The Stock In feature is used whenever new inventory enters the business.

When a staff member receives new products, they can record the incoming quantity through the system. The backend validates the request and updates the product's current stock quantity.

The operation is also recorded as a stock movement so that the business can later understand when and how inventory changed.

## Stock Out

The Stock Out feature records inventory leaving the business.

When products are sold, transferred, damaged, or otherwise removed from available inventory, the appropriate stock movement can be recorded.

StockSense includes an important protection against negative inventory. A stock out operation cannot reduce the available quantity below zero. This prevents incorrect records such as having minus five units of a product.

## Stock History

Every important inventory movement can be tracked through stock history.

The history allows authorized users to understand how inventory changed over time. Instead of only seeing the current quantity, managers can investigate previous stock in and stock out activities.

This creates better transparency and makes it easier to identify unusual or incorrect inventory changes.

## Low Stock Monitoring

StockSense can identify products whose current quantity has reached or fallen below their defined reorder level.

For example, if a product has a current quantity of 3 and its reorder level is 5, the system can identify that product as low stock.

This allows managers and staff to notice products that may require replenishment before they completely run out.

## AI Inventory Assistant

One of the main features of StockSense is its AI Inventory Assistant.

The assistant allows users to communicate with inventory data using natural language. Instead of manually searching through tables, users can ask questions such as:

What is the current stock of Type C Cable?

Which products are low in stock?

What inventory was recently added?

Which products need to be reordered?

The assistant processes the request and uses the actual inventory information available through the backend.

The AI is not intended to replace the inventory system. It acts as an intelligent interface on top of the existing inventory data.

## Human Confirmation

StockSense follows a human in the loop approach for important AI generated inventory changes.

The AI can prepare or suggest a stock action, but sensitive changes should not automatically be applied without user confirmation.

The user can review the proposed action and confirm or cancel it.

This approach provides the convenience of AI while keeping humans responsible for important business decisions.

## AI Outage Protection

The system does not depend completely on the AI assistant.

If the AI service becomes unavailable, users can still use normal inventory forms to perform supported operations.

This makes the system more reliable because the core inventory workflow does not stop simply because the AI component is temporarily unavailable.

## Authentication

StockSense uses authentication to ensure that only authorized users can access the system.

Users sign in through the application's authentication system, and the backend validates the authenticated user before allowing protected operations.

The application is designed without unnecessary additional authentication layers such as OTP verification, email verification, manager verification codes, or two step authentication screens unless specifically required.

The goal is to provide a straightforward authentication flow while still maintaining proper access control.

## Role Based Access Control

Role based access control ensures that different users can access different parts of the system.

The frontend provides the appropriate interface for each role, but the actual security rules are enforced by the backend.

This is important because frontend restrictions alone are not sufficient for protecting sensitive information.

A user should not be able to gain manager privileges simply by modifying frontend code or browser data.

## Backend

The backend of StockSense is developed using Python and FastAPI.

FastAPI provides the API layer between the web application, authentication system, database, and AI functionality.

The backend handles important operations including user authentication, product retrieval, stock in, stock out, stock history, low stock information, role verification, and AI requests.

The backend acts as the central control layer of the application and ensures that inventory operations follow the defined business rules.

## Database

Supabase is used as the main backend data platform and source of truth.

Inventory information is stored in structured database tables instead of relying on browser storage or temporary mock data.

The database contains information required for products, stock movements, pending stock actions, users, and related inventory operations.

Because the data is stored centrally, the frontend, backend, and AI assistant can work with the same inventory information.

## API Architecture

The frontend communicates with the Python backend through API endpoints.

Important endpoints include product retrieval, authentication, current user information, stock in, stock out, stock history, low stock detection, and AI chat functionality.

Protected requests use authorization credentials so that the backend can identify the authenticated user before processing the operation.

This architecture separates the user interface from the business logic and database operations.

## Data Validation

StockSense uses backend validation to protect the integrity of inventory data.

For example, the backend checks whether a requested product exists, whether a stock operation is valid, whether the user has permission to perform the operation, and whether a stock out operation would result in negative inventory.

This prevents invalid information from being inserted into the database.

## Security Approach

Security is implemented through authentication, authorization, role based permissions, backend validation, and controlled access to sensitive information.

The system does not treat frontend restrictions as the primary security mechanism.

The backend remains responsible for deciding whether an operation is permitted.

This design makes the application more suitable for real business environments where inventory information and management data should not be exposed to every employee.

## Frontend

The StockSense frontend provides a modern dashboard for interacting with the inventory system.

The interface includes product information, stock quantities, inventory operations, stock history, low stock information, authentication screens, and the AI assistant.

The interface is designed to make common inventory operations simple and accessible without requiring users to understand the technical architecture behind the system.

## Technology Stack

StockSense uses Python FastAPI for the backend API and business logic.

Supabase is used for database management and authentication related functionality.

The frontend is a modern web application that communicates with the backend through APIs.

Artificial intelligence is integrated through the AI assistant to provide natural language interaction with inventory information.

## Example Inventory Workflow

A typical workflow begins when a staff member receives new products.

The staff member signs into StockSense and records the incoming quantity.

The backend validates the request and updates the product quantity.

The stock movement is recorded in the inventory history.

If the resulting quantity remains below the reorder level, the product can appear in the low stock section.

Later, a manager can ask the AI assistant which products currently require restocking. The assistant retrieves the relevant inventory information and provides the answer based on actual system data.

If an AI generated stock action is proposed, the user can review it before confirming the change.

## Business Value

StockSense can help businesses reduce dependence on manual inventory records, improve visibility into stock levels, reduce inventory mistakes, identify products that require replenishment, and save time when searching for inventory information.

The AI assistant adds another layer of convenience by allowing users to interact with inventory data using normal language rather than relying entirely on manual navigation.

## Future Improvements

Future versions of StockSense could include advanced inventory forecasting, sales analytics, supplier management, automated purchase recommendations, barcode scanning, invoice integration, multilingual AI interaction, voice based inventory queries, advanced reporting, notification systems, and predictive stock demand analysis.

These features could further transform StockSense from a basic inventory management application into a complete intelligent inventory operations platform.

## Conclusion

StockSense demonstrates how traditional business processes can be combined with modern software architecture and artificial intelligence.

Instead of replacing the existing inventory workflow with AI, the system combines reliable database driven operations with an AI assistant while keeping important business decisions under human control.

The result is an inventory management platform that focuses on accuracy, accessibility, security, role based permissions, reliable stock tracking, and practical AI integration.
