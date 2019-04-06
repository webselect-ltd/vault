namespace Vault.Models
{
    public class LoginResult
    {
        public LoginResult(string userID) =>
            UserID = userID;

        public static LoginResult Failed =>
            new LoginResult(null);

        public string UserID { get; }

        public bool Success =>
            !string.IsNullOrWhiteSpace(UserID);
    }
}
