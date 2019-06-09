﻿using System;
using System.Globalization;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Vault.Support
{
    public static class InlineJsGlobalSerializer
    {
        private static readonly JsonSerializerSettings _settings =
            new JsonSerializerSettings {
                NullValueHandling = NullValueHandling.Ignore,
                ContractResolver = new DefaultContractResolver {
                    NamingStrategy = new CamelCaseNamingStrategy()
                }
            };

        /// <summary>
        /// Returns a JSON string representation of the specified object.
        /// </summary>
        /// <param name="o">The source object.</param>
        /// <returns>A formatted JSON string.</returns>
        public static string AsJson(this object o)
        {
            if (o == null)
            {
                throw new ArgumentNullException(nameof(o));
            }

            var serializer = JsonSerializer.CreateDefault(_settings);

            var sb = new StringBuilder(256);

            using (var sw = new StringWriter(sb, CultureInfo.InvariantCulture))
            using (var jsonWriter = GetJsonWriter(sw))
            {
                serializer.Serialize(jsonWriter, o);
            }

            return sb.ToString();
        }

        private static JsonTextWriter GetJsonWriter(StringWriter sw) =>
            new JsonTextWriter(sw) {
                Formatting = Formatting.Indented,
                IndentChar = ' ',
                Indentation = 4,
                QuoteName = false,
                QuoteChar = '\''
            };
    }
}
