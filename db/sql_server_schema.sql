USE master
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Vault')
BEGIN
    CREATE DATABASE Vault
END
GO

USE Vault
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Credentials') AND type in (N'U'))
BEGIN
    CREATE TABLE Credentials (
        CredentialID NVARCHAR(36) NOT NULL,
        UserID NVARCHAR(36) NOT NULL,
        Description NVARCHAR(max) NULL,
        Url NVARCHAR(max) NULL,
        Username NVARCHAR(max) NULL,
        Password NVARCHAR(max) NULL,
        Notes NVARCHAR(max) NULL,
        UserDefined1 NVARCHAR(max) NULL,
        UserDefined1Label NVARCHAR(max) NULL,
        UserDefined2 NVARCHAR(max) NULL,
        UserDefined2Label NVARCHAR(max) NULL,
        PwdOptions NVARCHAR(max) NULL,
        CONSTRAINT PK_tCredential PRIMARY KEY CLUSTERED (
            CredentialID ASC
        )
    )
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Users') AND type in (N'U'))
BEGIN
    CREATE TABLE Users (
        UserID NVARCHAR(36) NOT NULL,
        Username NVARCHAR(max) NOT NULL,
        Password NVARCHAR(max) NOT NULL,
        CONSTRAINT PK_tUser PRIMARY KEY CLUSTERED (
            UserID ASC
        )
    )
END
GO

