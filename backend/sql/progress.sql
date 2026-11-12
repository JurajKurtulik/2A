IF OBJECT_ID(N'dbo.ProfileProgress', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.ProfileProgress (
    ProfileId varchar(32) NOT NULL,
    EventId varchar(64) NOT NULL,
    Payload nvarchar(max) NOT NULL,
    CONSTRAINT PK_ProfileProgress PRIMARY KEY (ProfileId, EventId) WITH (IGNORE_DUP_KEY = ON),
    CONSTRAINT CK_ProfileProgress_Payload CHECK (ISJSON(Payload) = 1)
  );
END;
