
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;

namespace Bizsol_ESMS.Controllers
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddControllersWithViews();

            // Add session service
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30); // Session timeout
                options.Cookie.HttpOnly = true;
                options.Cookie.IsEssential = true;
            });

            

            builder.Services.AddControllersWithViews().AddMvcOptions(options =>
                options.Filters.Add(
                    new ResponseCacheAttribute
                    {
                        NoStore = true
                    }));

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin",
                    policy =>
                    {
                        policy.AllowAnyOrigin()
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    });
            });
            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseStaticFiles();

            app.UseSession();
            app.UseRouting();

            app.UseAuthorization();

            //app.MapControllerRoute(
            //name: "default",
            //pattern: "{controller=Login}/{action=Login}/{id?}");
           app.MapControllerRoute(
           name: "default",
           pattern: "{controller=Dashbord}/{action=Dashbord}/{id?}");
           app.Run();
        }
    }
}