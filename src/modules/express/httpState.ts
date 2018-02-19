export enum EHttpState {
    eOk                           = 200,
    eCreated                      = 201,
    eBadRequest                   = 400,
    eUnauthorized                 = 401,
    eForbidden                    = 403,
    eNotFound                     = 404,
    eConflict                     = 409,
    eTooManyRequests              = 429,
    eServerError                  = 500,
    eNotImplemented               = 501,
    eUnavailable                  = 502,
    eInsufficientStorage          = 507,
    eNetworkAuthorizationRequired = 511
}