from accounts.models import AuditLog


class AuditLogMiddleware:
    """Logs every authenticated user request"""
    EXCLUDED_PATHS = ['/static/', '/media/', '/favicon.ico']

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log authenticated users, skip static files
        if request.user.is_authenticated:
            if not any(request.path.startswith(p) for p in self.EXCLUDED_PATHS):
                ip = self._get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action=f'{request.method} {request.path}',
                    path=request.path,
                    method=request.method,
                    ip_address=ip,
                    extra_data={
                        'status_code': response.status_code,
                        'query_string': request.META.get('QUERY_STRING', ''),
                    }
                )
        return response

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
