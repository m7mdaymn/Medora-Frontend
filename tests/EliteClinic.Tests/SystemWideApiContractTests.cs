using EliteClinic.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using System.Reflection;
using System.Text.RegularExpressions;
using Xunit;

namespace EliteClinic.Tests;

public class SystemWideApiContractTests
{
    private static readonly string[] ExpectedControllerNames =
    [
        nameof(AuthController),
        nameof(BookingsController),
        nameof(ClinicServicesController),
        nameof(ClinicSettingsController),
        nameof(DoctorNotesController),
        nameof(DoctorsController),
        nameof(ExpensesController),
        nameof(FeatureFlagsController),
        nameof(FinanceController),
        nameof(HealthController),
        nameof(InventoryController),
        nameof(InvoicesController),
        nameof(LabRequestsController),
        nameof(MarketplaceOrdersController),
        nameof(MediaController),
        nameof(MessagesController),
        nameof(NotificationsController),
        nameof(PartnerOrdersController),
        nameof(PartnersController),
        nameof(PatientAppController),
        nameof(PatientCreditsController),
        nameof(PatientMedicalController),
        nameof(PatientsController),
        nameof(PrescriptionsController),
        nameof(PublicController),
        nameof(QueueBoardController),
        nameof(QueueSessionsController),
        nameof(QueueTicketsController),
        nameof(ReportsController),
        nameof(SelfServiceRequestsController),
        nameof(StaffController),
        nameof(SubscriptionsController),
        nameof(TenantsController),
        nameof(VisitsController),
        nameof(WorkforceController)
    ];

    [Fact]
    public void ApiControllerSurface_ShouldContainExpectedControllers()
    {
        var actual = GetApiControllerTypes()
            .Select(t => t.Name)
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();

        foreach (var expected in ExpectedControllerNames)
        {
            Assert.Contains(expected, actual);
        }

        Assert.True(
            actual.Count >= ExpectedControllerNames.Length,
            $"Controller count dropped unexpectedly. Expected at least {ExpectedControllerNames.Length}, got {actual.Count}.");
    }

    [Fact]
    public void EveryPublicControllerAction_ShouldDeclareHttpVerb()
    {
        var violations = new List<string>();

        foreach (var controller in GetApiControllerTypes())
        {
            foreach (var action in GetControllerActions(controller))
            {
                var hasHttpVerb = action.GetCustomAttributes<HttpMethodAttribute>(inherit: true).Any();
                if (!hasHttpVerb)
                {
                    violations.Add($"{controller.Name}.{action.Name}");
                }
            }
        }

        Assert.True(
            violations.Count == 0,
            $"Public controller actions without Http* attributes: {string.Join(", ", violations)}");
    }

    [Fact]
    public void ProtectedControllers_ShouldRequireAuthorizeUnlessExplicitlyAnonymous()
    {
        var anonymousControllers = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            nameof(AuthController),
            nameof(HealthController),
            nameof(PublicController)
        };

        var violations = new List<string>();

        foreach (var controller in GetApiControllerTypes())
        {
            if (anonymousControllers.Contains(controller.Name))
            {
                continue;
            }

            var classHasAuthorize = controller.GetCustomAttribute<AuthorizeAttribute>(inherit: true) is not null;

            foreach (var action in GetControllerActions(controller))
            {
                if (action.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) is not null)
                {
                    continue;
                }

                var actionHasAuthorize = action.GetCustomAttribute<AuthorizeAttribute>(inherit: true) is not null;
                if (!classHasAuthorize && !actionHasAuthorize)
                {
                    violations.Add($"{controller.Name}.{action.Name}");
                }
            }
        }

        Assert.True(
            violations.Count == 0,
            $"Protected actions missing authorization attributes: {string.Join(", ", violations)}");
    }

    [Fact]
    public void EndpointSurface_ShouldRemainComprehensive()
    {
        var endpointCount = GetAllRouteEntries().Count;

        Assert.True(
            endpointCount >= 200,
            $"Endpoint surface unexpectedly low. Expected >= 200 routed actions, got {endpointCount}.");
    }

    [Fact]
    public void RouteAndVerbCombinations_ShouldBeUnique()
    {
        var seen = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var duplicates = new List<string>();

        foreach (var entry in GetAllRouteEntries())
        {
            var key = $"{entry.Verb} {entry.Route}";
            var origin = $"{entry.Controller.Name}.{entry.Action.Name}";

            if (seen.TryGetValue(key, out var existing))
            {
                duplicates.Add($"{key} => {existing} and {origin}");
                continue;
            }

            seen[key] = origin;
        }

        Assert.True(duplicates.Count == 0, $"Duplicate verb+route combinations found: {string.Join(" | ", duplicates)}");
    }

    [Fact]
    public void RoleCoverage_ShouldIncludeAllBusinessRoles()
    {
        var discoveredRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var controller in GetApiControllerTypes())
        {
            foreach (var role in GetRoles(controller.GetCustomAttributes<AuthorizeAttribute>(inherit: true)))
            {
                discoveredRoles.Add(role);
            }

            foreach (var action in GetControllerActions(controller))
            {
                foreach (var role in GetRoles(action.GetCustomAttributes<AuthorizeAttribute>(inherit: true)))
                {
                    discoveredRoles.Add(role);
                }
            }
        }

        var requiredRoles = new[]
        {
            "SuperAdmin",
            "ClinicOwner",
            "ClinicManager",
            "Receptionist",
            "Doctor",
            "Nurse",
            "Patient",
            "Contractor"
        };

        foreach (var role in requiredRoles)
        {
            Assert.Contains(role, discoveredRoles, StringComparer.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public void Phase4Endpoints_ShouldExistWithExpectedRoutes()
    {
        AssertEndpointExists<PartnersController>(nameof(PartnersController.CreateContract), "POST", "api/clinic/partners/contracts");
        AssertEndpointExists<PartnersController>(nameof(PartnersController.ListServices), "GET", "api/clinic/partners/services");
        AssertEndpointExists<PartnersController>(nameof(PartnersController.CreateService), "POST", "api/clinic/partners/services");
        AssertEndpointExists<PartnersController>(nameof(PartnersController.UpdateService), "PUT", "api/clinic/partners/services/{itemid:guid}");
        AssertEndpointExists<PartnersController>(nameof(PartnersController.CreatePartnerUser), "POST", "api/clinic/partners/{partnerid:guid}/users");
        AssertEndpointExists<PartnerOrdersController>(nameof(PartnerOrdersController.UpdateStatus), "POST", "api/clinic/partner-orders/{orderid:guid}/status");
        AssertEndpointExists<PartnerOrdersController>(nameof(PartnerOrdersController.Accept), "POST", "api/clinic/partner-orders/{orderid:guid}/accept");
        AssertEndpointExists<PartnerOrdersController>(nameof(PartnerOrdersController.Schedule), "POST", "api/clinic/partner-orders/{orderid:guid}/schedule");
        AssertEndpointExists<PartnerOrdersController>(nameof(PartnerOrdersController.MarkArrived), "POST", "api/clinic/partner-orders/{orderid:guid}/arrived");
        AssertEndpointExists<PartnerOrdersController>(nameof(PartnerOrdersController.UploadResult), "POST", "api/clinic/partner-orders/{orderid:guid}/result");
        AssertEndpointExists<LabRequestsController>(nameof(LabRequestsController.CreatePartnerOrder), "POST", "api/clinic/visits/{visitid:guid}/labs/{labrequestid:guid}/partner-order");
        AssertEndpointExists<PrescriptionsController>(nameof(PrescriptionsController.GetRevisions), "GET", "api/clinic/visits/{visitid:guid}/prescriptions/{id:guid}/revisions");
        AssertEndpointExists<PatientMedicalController>(nameof(PatientMedicalController.AddThreadReply), "POST", "api/clinic/patients/{patientid:guid}/medical-documents/{documentid:guid}/threads/{threadid:guid}/replies");
        AssertEndpointExists<NotificationsController>(nameof(NotificationsController.MarkAllInAppRead), "POST", "api/clinic/notifications/in-app/mark-all-read");
        AssertEndpointExists<PatientAppController>(nameof(PatientAppController.GetPartnerOrders), "GET", "api/clinic/patient-app/profiles/{patientid:guid}/partner-orders");
    }

    private static void AssertEndpointExists<TController>(string actionName, string verb, string expectedRoute)
    {
        var controller = typeof(TController);
        var action = controller.GetMethod(actionName, BindingFlags.Public | BindingFlags.Instance);

        Assert.NotNull(action);

        var routeEntries = GetRouteEntriesForAction(controller, action!).ToList();

        Assert.Contains(routeEntries, e =>
            string.Equals(e.Verb, verb, StringComparison.OrdinalIgnoreCase)
            && string.Equals(e.Route, NormalizeRoute(expectedRoute), StringComparison.OrdinalIgnoreCase));
    }

    private static IEnumerable<string> GetRoles(IEnumerable<AuthorizeAttribute> authorizeAttributes)
    {
        foreach (var authorize in authorizeAttributes)
        {
            if (string.IsNullOrWhiteSpace(authorize.Roles))
            {
                continue;
            }

            foreach (var role in authorize.Roles.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            {
                yield return role;
            }
        }
    }

    private static List<RouteEntry> GetAllRouteEntries()
    {
        var entries = new List<RouteEntry>();

        foreach (var controller in GetApiControllerTypes())
        {
            foreach (var action in GetControllerActions(controller))
            {
                entries.AddRange(GetRouteEntriesForAction(controller, action));
            }
        }

        return entries;
    }

    private static IEnumerable<RouteEntry> GetRouteEntriesForAction(Type controller, MethodInfo action)
    {
        var attributes = action.GetCustomAttributes<HttpMethodAttribute>(inherit: true).ToList();
        var classRoute = controller.GetCustomAttribute<RouteAttribute>(inherit: true)?.Template
            ?? $"api/{controller.Name.Replace("Controller", string.Empty, StringComparison.OrdinalIgnoreCase)}";

        foreach (var attribute in attributes)
        {
            var route = BuildResolvedRoute(classRoute, attribute.Template, controller, action);
            foreach (var verb in attribute.HttpMethods)
            {
                yield return new RouteEntry(controller, action, verb.ToUpperInvariant(), route);
            }
        }
    }

    private static string BuildResolvedRoute(string classRoute, string? actionTemplate, Type controller, MethodInfo action)
    {
        var resolvedClass = classRoute
            .Replace("[controller]", controller.Name.Replace("Controller", string.Empty, StringComparison.OrdinalIgnoreCase), StringComparison.OrdinalIgnoreCase)
            .Replace("[action]", action.Name, StringComparison.OrdinalIgnoreCase);

        string combined;
        if (string.IsNullOrWhiteSpace(actionTemplate))
        {
            combined = resolvedClass;
        }
        else if (actionTemplate.StartsWith("~/", StringComparison.Ordinal))
        {
            combined = actionTemplate[2..];
        }
        else
        {
            combined = $"{resolvedClass.TrimEnd('/')}/{actionTemplate.TrimStart('/')}";
        }

        return NormalizeRoute(combined);
    }

    private static string NormalizeRoute(string route)
    {
        var normalized = route.Trim().Replace('"', '\0').Trim('\0');
        normalized = Regex.Replace(normalized, "//+", "/");
        return normalized.ToLowerInvariant();
    }

    private static List<Type> GetApiControllerTypes()
    {
        var apiAssembly = typeof(AuthController).Assembly;

        return apiAssembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract)
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t))
            .Where(t => t.Name.EndsWith("Controller", StringComparison.Ordinal))
            .OrderBy(t => t.Name, StringComparer.Ordinal)
            .ToList();
    }

    private static IEnumerable<MethodInfo> GetControllerActions(Type controller)
    {
        return controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
            .Where(m => !m.IsSpecialName)
            .Where(m => m.GetCustomAttribute<NonActionAttribute>(inherit: true) is null);
    }

    private readonly record struct RouteEntry(Type Controller, MethodInfo Action, string Verb, string Route);
}