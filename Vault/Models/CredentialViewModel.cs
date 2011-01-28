using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel;

namespace Vault.Models
{
    public class CredentialViewModel
    {
        public string CredentialID { get; set; }
        public string UserID { get; set; }
        public string Description { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        [DisplayName("Password Again")]
        public string PasswordConfirmation { get; set; }
        public string Url { get; set; }
        [DisplayName("Custom 1 Label")]
        public string UserDefined1Label { get; set; }
        [DisplayName("Custom 1")]
        public string UserDefined1 { get; set; }
        [DisplayName("Custom 2 Label")]
        public string UserDefined2Label { get; set; }
        [DisplayName("Custom 2")]
        public string UserDefined2 { get; set; }
        public string Notes { get; set; }
    }
}