namespace Vault.Models
{
    public struct LoginResult
    {
        public LoginResult(string userID) => UserID = userID;

        public string UserID { get; }
        public bool Success => !string.IsNullOrWhiteSpace(UserID);
    }
}
