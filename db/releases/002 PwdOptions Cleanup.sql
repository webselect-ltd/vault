USE vault

UPDATE 
    Credentials 
SET 
    PwdOptions = NULL 
WHERE 
    PwdOptions = '16|1|1|1|1'

SELECT * FROM Credentials
