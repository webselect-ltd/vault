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

