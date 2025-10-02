-- Contact Submissions Table Schema
-- This table stores contact form submissions from the frontend

CREATE TABLE ContactSubmissions (
    SubmissionID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SubmissionDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'New',
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NOT NULL DEFAULT GETDATE()
);

-- Create index for better query performance
CREATE INDEX IX_ContactSubmissions_Status ON ContactSubmissions(Status);
CREATE INDEX IX_ContactSubmissions_SubmissionDate ON ContactSubmissions(SubmissionDate);

-- Add some sample data (optional)
INSERT INTO ContactSubmissions (Name, Email, Message, Status) VALUES
('John Doe', 'john.doe@example.com', 'I am interested in your office furniture solutions. Could you please send me more information about your custom furniture options?', 'New'),
('Jane Smith', 'jane.smith@company.com', 'We are looking to furnish our new office space. Do you offer bulk discounts for large orders?', 'New'),
('Mike Johnson', 'mike.j@business.com', 'I saw your gallery and I am impressed with your designs. Can we schedule a consultation?', 'Read');
