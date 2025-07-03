package entity

import "encoding/json"

type Realm struct {
	ID        int             `json:"id"`
	OwnerID   int             `json:"owner_id"`
	Name      string          `json:"name"`
	MapData   json.RawMessage `json:"map_data"`
	ShareID   *string         `json:"share_id"`
	OnlyOwner bool            `json:"only_owner"`
	// เพิ่ม field อื่นๆ ตามต้องการ
}
