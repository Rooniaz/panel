<?php

namespace Pterodactyl\Models;

class UserMenuOrder extends Model
{
    protected $table = 'user_menu_orders';

    protected $fillable = ['user_id', 'menu_path', 'order'];

    public $timestamps = true;

    public static array $validationRules = [
        'user_id' => 'required|integer|exists:users,id',
        'menu_path' => 'required|string|max:191',
        'order' => 'required|integer|min:0',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

