using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Vault.Models;
using Dapper;

namespace Vault.Controllers
{
    public class MainController : Controller
    {
        private ConnectionFactoryBase _cf;

        public MainController(ConnectionFactoryBase cf)
        {
            _cf = cf;
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Generate()
        {
            return View(new GenerateViewModel {
                GUID = Guid.NewGuid().ToString()
            });
        }

        public ActionResult SetDevCookie()
        {
            return View();
        }

        [HttpPost]
        public ActionResult GetAll(string userId)
        {
            IEnumerable<CredentialListViewModel> credentials;

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                credentials = conn.Query<CredentialListViewModel>("select CredentialID, UserID, Description, Username, Password, Url from Credentials where UserID = @UserID", new { UserID = userId });
            }

            return Json(credentials);
        }

        [HttpPost]
        public ActionResult GetAllComplete(string userId)
        {
            IEnumerable<CredentialViewModel> credentials;

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                credentials = conn.Query<CredentialViewModel>("select * from Credentials where UserID = @UserID", new { UserID = userId });
            }

            return Json(credentials);
        }

        [HttpPost]
        public ActionResult Load(string id)
        {
            CredentialViewModel credential;

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                credential = conn.Query<CredentialViewModel>("select * from Credentials where CredentialID = @CredentialID", new { CredentialID = id }).FirstOrDefault();
            }

            // Fix for previous behaviour
            if (credential != null)
                credential.PasswordConfirmation = credential.Password;

            return Json(credential);
        }

        [HttpPost]
        public ActionResult Delete(string credentialId, string userId)
        {
            var success = true;

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                conn.Execute("delete from Credentials where UserID = @UserID and CredentialID = @CredentialID", new { UserID = userId, CredentialID = credentialId });
            }

            return Json(new { Success = success });
        }

        [HttpPost]
        public ActionResult UpdateMultiple(IList<CredentialViewModel> model)
        {
            foreach (var item in model)
                UpdateCredential(item);

            return Json(new { Updated = model.Count });
        }

        [HttpPost]
        public ActionResult Update(CredentialViewModel model)
        {
            var updated = UpdateCredential(model);

            return Json(new { updated.CredentialID });
        }

        private CredentialViewModel UpdateCredential(CredentialViewModel model)
        {
            var sql = "insert into Credentials (CredentialID, UserID, Description, Username, Password, Url, UserDefined1Label, UserDefined1, UserDefined2Label, UserDefined2, Notes, PwdOptions) values " +
                      "(@CredentialID, @UserID, @Description, @Username, @Password, @Url, @UserDefined1Label, @UserDefined1, @UserDefined2Label, @UserDefined2, @Notes, @PwdOptions); select @CredentialID as id;";

            if (model.CredentialID != null)
            {
                sql = "update Credentials set UserID = @UserID, Description = @Description, Username = @Username, Password = @Password, Url = @Url, UserDefined1Label = @UserDefined1Label, " +
                      "UserDefined1 = @UserDefined1, UserDefined2Label = @UserDefined2Label, UserDefined2 = @UserDefined2, Notes = @Notes, PwdOptions = @PwdOptions where credentialid = @CredentialID; select @CredentialID as id;";
            }

            if (model.CredentialID == null)
                model.CredentialID = Guid.NewGuid().ToString();

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                conn.Execute(sql, model);
            }

            return model;
        }

        [HttpPost]
        public ActionResult UpdatePassword(string userId, string oldHash, string newHash)
        {
            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                conn.Execute("update Users set Password = @NewHash where UserID = @UserID and Password = @OldHash", new { UserID = userId, OldHash = oldHash, NewHash = newHash });
            }

            return Json(new { success = true });
        }

        [HttpPost]
        public ActionResult Login(LoginViewModel model)
        {
            var userId = "";

            using (var conn = _cf.GetConnection())
            {
                conn.Open();
                userId = conn.Query<string>("select * from Users where Username = @Username and Password = @Password", new { Username = model.UN1209, Password = model.PW9804 }).FirstOrDefault();
            }

            return Json(new { result = ((!string.IsNullOrEmpty(userId)) ? 1 : 0), id = userId });
        }

        public ActionResult Tests()
        {
            return View();
        }
    }
}