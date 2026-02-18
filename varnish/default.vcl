vcl 4.1;

backend default {
  .host = "nginx";
  .port = "80";
}

sub vcl_recv {
  if (req.method != "GET" && req.method != "HEAD") {
    return (pass);
  }

  if (req.url ~ "^/api/jobs") {
    return (hash);
  }

  return (pass);
}

sub vcl_backend_response {
  if (bereq.url ~ "^/api/jobs") {
    set beresp.ttl = 60s;
    set beresp.grace = 30s;
    return (deliver);
  }

  set beresp.uncacheable = true;
  set beresp.ttl = 0s;
  return (deliver);
}

sub vcl_deliver {
  if (obj.hits > 0) {
    set resp.http.X-Cache = "HIT";
  } else {
    set resp.http.X-Cache = "MISS";
  }
}
