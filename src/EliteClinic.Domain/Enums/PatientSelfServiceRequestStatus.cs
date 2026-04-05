namespace EliteClinic.Domain.Enums;

public enum PatientSelfServiceRequestStatus
{
    PendingPaymentReview = 0,
    PaymentApproved = 1,
    ConvertedToQueueTicket = 2,
    ConvertedToBooking = 3,
    Rejected = 4,
    ReuploadRequested = 5,
    Expired = 6
}
