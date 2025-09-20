package models

type PaginationMeta struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
	Total    int `json:"total"`
	TotalPages int `json:"totalPages"`
}