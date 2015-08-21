using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Vault.Models
{
    public class LoginViewModel
    {
        [Display(Name="Username")]
        public string UN1209 { get; set; }
        [Display(Name="Password")]
        public string PW9804 { get; set; }
    }
}