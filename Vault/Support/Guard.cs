using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft;

namespace Vault.Support
{
    public static class Guard
    {
        public static void AgainstNull([ValidatedNotNull][NotNull] object value, string argumentName)
        {
            if (value is null)
            {
                throw new ArgumentNullException(argumentName);
            }
        }

        public static void AgainstNullOrEmpty([ValidatedNotNull][NotNull] string value, string argumentName)
        {
            AgainstNull(value, argumentName);

            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentOutOfRangeException(argumentName);
            }
        }

        public static void AgainstEmpty(Guid value, string argumentName)
        {
            if (value == Guid.Empty)
            {
                throw new ArgumentNullException(argumentName);
            }
        }
    }
}
