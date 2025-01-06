using System.Text;

namespace Bizsol_ESMS.Models
{
    public class CommonFunction
    {
        public static async Task<string> DecryptPasswordAsync(string encryptedPassword)
        {
            StringBuilder decryptedPassword = new StringBuilder();
            foreach (char c in encryptedPassword)
            {
                decryptedPassword.Append(Convert.ToChar(Convert.ToInt32(c) - 10));
            }
            await Task.CompletedTask;
            return decryptedPassword.ToString();
        }
    }
}
