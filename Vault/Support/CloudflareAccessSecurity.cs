using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Vault.Support
{
    public static class CloudflareAccessSecurity
    {
        public static bool TryValidateToken(
            ILogger logger,
            string token,
            string issuer,
            string audience,
            ICollection<SecurityKey> signingKeys,
            out JwtSecurityToken jwt)
        {
            jwt = null;

            var validationParameters = new TokenValidationParameters {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = signingKeys,
                ValidateLifetime = true
            };

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();

                tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                jwt = (JwtSecurityToken)validatedToken;

                logger.LogDebug("CF JWT: Token is valid");

                return true;
            }
            catch (SecurityTokenValidationException ex)
            {
                logger.LogDebug("CF JWT: Failed to validate token: {Message}", ex.Message);

                return false;
            }
        }

        public static async Task<ICollection<SecurityKey>> RetrieveSigningKeys(
            ILogger logger,
            string teamDomain)
        {
            try
            {
                var configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    $"https://{teamDomain}/.well-known/openid-configuration",
                    new OpenIdConnectConfigurationRetriever(),
                    new HttpDocumentRetriever());

                var discoveryDocument = await configurationManager.GetConfigurationAsync();

                logger.LogDebug("CF JWT: Retrieved signing keys");

                return discoveryDocument.SigningKeys;
            }
            catch (Exception ex)
            {
                logger.LogDebug("CF JWT: Failed to retrieve signing keys: {Message}", ex.Message);

                return [];
            }
        }
    }
}
