using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Vault.Models;
using System.Data.SQLite;
using System.Configuration;
using System.Data;

namespace Vault.Controllers
{
    public class MainController : Controller
    {
        SQLiteConnection _conn;

        public MainController()
        {
            _conn = new SQLiteConnection(ConfigurationManager.ConnectionStrings["Vault"].ConnectionString);
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Generate()
        {
            return View();
        }

        [HttpPost]
        public ActionResult GetAll()
        {
            _conn.Open();

            var cmd = new SQLiteCommand("select * from tcredential where userid = @UserID", _conn);
            cmd.Parameters.Add("@UserID", DbType.String).Value = Request["id"].ToString();

            var credentials = new List<CredentialViewModel>();

            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    credentials.Add(new CredentialViewModel {
                        CredentialID = r["CredentialID"].ToString(),
                        Description = r["Description"].ToString(),
                        Username = r["Username"].ToString(),
                        Password = r["Password"].ToString(),
                        PasswordConfirmation = r["Password"].ToString(),
                        Url = r["Url"].ToString(),
                        UserDefined1Label = r["UserDefined1Label"].ToString(),
                        UserDefined1 = r["UserDefined1"].ToString(),
                        UserDefined2Label = r["UserDefined2Label"].ToString(),
                        UserDefined2 = r["UserDefined2"].ToString(),
                        Notes = r["Notes"].ToString()
                    });
                }
            }

            _conn.Close();

            return Json(credentials);
        }

        [HttpPost]
        public ActionResult Load(string id)
        {
            return Json("");
        }

        [HttpPost]
        public ActionResult Update(CredentialViewModel model)
        {
            return Json(model);
        }

        [HttpPost]
        public ActionResult Login(LoginViewModel model)
        {
            _conn.Open();

            var cmd = new SQLiteCommand("select * from tuser where username = @UserName and password = @Password", _conn);
            cmd.Parameters.Add("@Username", DbType.String).Value = model.Username;
            cmd.Parameters.Add("@Password", DbType.String).Value = model.Password;

            var userId = "";

            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                    userId = r["UserID"].ToString();
            }

            _conn.Close();

            return Json(new { result = ((userId != "") ? 1 : 0), id = userId });
        }
    }
}
