-- Update Orders table to include delivery information
-- This script adds delivery type and cost columns to the Orders table

-- Add delivery type column (pickup or delivery rate ID)
ALTER TABLE Orders 
ADD DeliveryType NVARCHAR(20) NOT NULL DEFAULT('pickup');

-- Add delivery cost column
ALTER TABLE Orders 
ADD DeliveryCost DECIMAL(10,2) NOT NULL DEFAULT(0);

-- Add constraint to ensure only valid delivery types
ALTER TABLE Orders 
ADD CONSTRAINT CHK_Orders_DeliveryType 
CHECK (DeliveryType IN ('pickup') OR DeliveryType LIKE 'rate_%');

-- Update existing orders to have pickup as default
UPDATE Orders 
SET DeliveryType = 'pickup', DeliveryCost = 0
WHERE DeliveryType IS NULL OR DeliveryCost IS NULL;

-- Create index for better performance
CREATE INDEX IX_Orders_DeliveryType ON Orders(DeliveryType);

PRINT 'Orders table updated successfully with delivery information.';
