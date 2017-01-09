CREATE TABLE IF NOT EXISTS Credentials (
    "CredentialID" NVARCHAR(36) PRIMARY KEY NOT NULL,
    "UserID" NVARCHAR(36) NOT NULL,
    "Description" NVARCHAR NULL,
    "Url" NVARCHAR NULL,
    "Username" NVARCHAR NULL,
    "Password" NVARCHAR NULL,
    "Notes" NVARCHAR NULL,
    "UserDefined1" NVARCHAR NULL,
    "UserDefined1Label" NVARCHAR NULL,
    "UserDefined2" NVARCHAR NULL,
    "UserDefined2Label" NVARCHAR NULL,
    "PwdOptions" NVARCHAR NULL
);

CREATE TABLE IF NOT EXISTS Users (
    "UserID" NVARCHAR(36) PRIMARY KEY NOT NULL,
    "Username" NVARCHAR NOT NULL,
    "Password" NVARCHAR NOT NULL
);

INSERT INTO
    Users (
        "UserID",
        "Username",
        "Password"
    )
SELECT
    "UserID",
    "UserName",
    "Password"
FROM 
    tUser
WHERE NOT EXISTS (
    SELECT 
        * 
    FROM 
        Users 
    WHERE 
        "UserID" = tUser."UserID"
);

INSERT INTO
    Credentials (
        "CredentialID",
        "UserID",
        "Description",
        "Url",
        "Username",
        "Password",
        "Notes",
        "UserDefined1",
        "UserDefined1Label",
        "UserDefined2",
        "UserDefined2Label",
        "PwdOptions"
    )
SELECT
    "CredentialID",
    "UserID",
    "Description",
    "Url",
    "Username",
    "Password",
    "Notes",
    "UserDefined1",
    "UserDefined1Label",
    "UserDefined2",
    "UserDefined2Label",
    '16|1|1|1|1' AS "PwdOptions"
FROM 
    tCredential
WHERE NOT EXISTS (
    SELECT 
        * 
    FROM 
        Credentials 
    WHERE 
        "CredentialID" = tCredential."CredentialID"
);

DROP TABLE IF EXISTS tCredential;

DROP TABLE IF EXISTS tUser;

