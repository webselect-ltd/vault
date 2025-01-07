using System;
using Vault.Models;

namespace Vault.Support
{
    public static class SqlStatements
    {
        public const string SelectSummary =
            @"SELECT
                  CredentialID,
                  Description,
                  Username,
                  Password,
                  Url
              FROM
                  Credentials
              WHERE
                  UserID = @UserID";

        public const string Select =
            """
            SELECT
                *
            FROM
                Credentials
            WHERE
                UserID = @UserID;

            SELECT
                tc.CredentialID,
                tc.TagID,
                t.Label
            FROM
                Tags_Credentials tc
            INNER JOIN
                Tags t
                    ON t.TagID = tc.TagID
                    AND t.UserID = @UserID
            ORDER BY
                t.Label;
            """;

        public const string SelectSingle =
            """
            SELECT
                *
            FROM
                Credentials
            WHERE
                UserID = @UserID
            AND
                CredentialID = @CredentialID;

            SELECT
                tc.TagID,
                t.Label
            FROM
                Tags_Credentials tc
            INNER JOIN
                Tags t
                    ON t.TagID = tc.TagID
            WHERE
                tc.CredentialID = @CredentialID
            ORDER BY
                t.Label;
            """;

        public const string Insert =
            """
            INSERT INTO
                Credentials (
                    CredentialID,
                    UserID,
                    Description,
                    Username,
                    Password,
                    Url,
                    UserDefined1Label,
                    UserDefined1,
                    UserDefined2Label,
                    UserDefined2,
                    Notes,
                    PwdOptions
                )
            VALUES (
                @CredentialID,
                @UserID,
                @Description,
                @Username,
                @Password,
                @Url,
                @UserDefined1Label,
                @UserDefined1,
                @UserDefined2Label,
                @UserDefined2,
                @Notes,
                @PwdOptions
            );
            """;

        public const string Update =
            @"UPDATE
                  Credentials
              SET
                  Description = @Description,
                  Username = @Username,
                  Password = @Password,
                  Url = @Url,
                  UserDefined1Label = @UserDefined1Label,
                  UserDefined1 = @UserDefined1,
                  UserDefined2Label = @UserDefined2Label,
                  UserDefined2 = @UserDefined2,
                  Notes = @Notes,
                  PwdOptions = @PwdOptions
              WHERE
                  CredentialID = @CredentialID";

        public const string Delete =
            "DELETE FROM Credentials WHERE UserID = @UserID AND CredentialID = @CredentialID";

        public const string UpdatePassword =
            "UPDATE Users SET Password = @NewPasswordHash WHERE UserID = @UserID AND Password = @OldPasswordHash";

        public const string Login =
            "SELECT UserID FROM Users WHERE Username = @Username AND Password = @Password";

        public const string TagIndex =
            """
            SELECT
                TagID,
                Label
            FROM
                Tags
            WHERE
                UserID = @UserID
            ORDER BY
                Label;

            SELECT
                tc.TagID,
                tc.CredentialID
            FROM
                Tags_Credentials tc
            INNER JOIN
                Tags t
                    ON t.TagID = tc.TagID
            WHERE
                t.UserID = @UserID
            ORDER BY
                t.Label;
            """;

        public const string InsertNewTags =
            $"""
            INSERT INTO
                Tags (
                    TagID,
                    UserID,
                    Label
                )
            VALUES (
                    @TagID,
                    @UserID,
                    @Label
                )
            """;

        public const string DeleteTagsFromCredential =
            """
            DELETE FROM
                Tags_Credentials
            WHERE
                CredentialID = @CredentialID;
            """;

        public const string DeleteTags =
            """
            DELETE FROM
                Tags_Credentials
            WHERE
                TagID IN @TagIDs;

            DELETE FROM
                Tags
            WHERE
                TagID IN @TagIDs;
            """;

        public const string TagsToCredential =
            """
            INSERT INTO
                Tags_Credentials (
                    TagID,
                    CredentialID
                )
            VALUES (
                @TagID,
                @CredentialID
            );
            """;

        public const string UpdateTagLabel =
            """
            UPDATE
                Tags
            SET
                Label = @Label
            WHERE
                TagID = @TagID
            """;

        public static DatabaseType DatabaseType { get; internal set; }
    }
}
