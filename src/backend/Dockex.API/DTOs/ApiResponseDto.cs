namespace Dockex.API.DTOs;

public class ApiResponseDto<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public List<string> Errors { get; set; } = new();

    public ApiResponseDto()
    {
    }

    public ApiResponseDto(T data, string message = "Success")
    {
        Success = true;
        Message = message;
        Data = data;
    }

    public ApiResponseDto(string error)
    {
        Success = false;
        Message = "Error";
        Errors.Add(error);
    }

    public ApiResponseDto(List<string> errors)
    {
        Success = false;
        Message = "Validation errors";
        Errors = errors;
    }
}

public class PagedResponseDto<T>
{
    public List<T> Data { get; set; } = new();
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }

    public PagedResponseDto()
    {
    }

    public PagedResponseDto(List<T> data, int totalRecords, int currentPage, int pageSize)
    {
        Data = data;
        TotalRecords = totalRecords;
        CurrentPage = currentPage;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling((double)totalRecords / pageSize);
        HasNextPage = currentPage < TotalPages;
        HasPreviousPage = currentPage > 1;
    }
}