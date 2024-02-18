using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace Utils
{
    internal static class Program
    {
        private static int Main(string[] args)
        {
            var distPath = args[0];
            var viewsPath = args[1];

            var files = Directory.GetFiles(distPath, "*.min.js");

            var regex = new Regex("integrity=\"sha512-.*?\"");

            foreach (var file in files)
            {
                var bytes = File.ReadAllBytes(file);

                var algorithm = SHA512.Create();

                var hashedBytes = algorithm.ComputeHash(bytes);

                var hash = Convert.ToBase64String(hashedBytes);

                var viewPath = $"{viewsPath}/{Path.GetFileName(file).Replace(".min.js", string.Empty)}.cshtml";

                var content = File.ReadAllText(viewPath);

                var updatedContent = regex.Replace(content, $"integrity=\"sha512-{hash}\"");

                Console.WriteLine($"Updated {viewPath}");
                Console.WriteLine($"{Path.GetFileName(file)}: sha512-{hash}");

                File.WriteAllText(viewPath, updatedContent);
            }

            return 0;
        }
    }
}
