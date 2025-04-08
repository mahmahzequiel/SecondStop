<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Inventory extends Model
{
    use SoftDeletes;
    
    // This model will handle both tables through different methods
    
    /**
     * Get a sack record
     */
    public static function getSack($id)
    {
        return \DB::table('inventory_sacks')->where('id', $id)->first();
    }
    
    /**
     * Get all sacks
     */
    public static function getAllSacks($filters = [])
    {
        $query = \DB::table('inventory_sacks');
        
        // Apply filters if any
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        return $query->orderBy('date_received', 'desc')->get();
    }
    
    /**
     * Create a new sack
     */
    public static function createSack($data)
    {
        return \DB::table('inventory_sacks')->insertGetId([
            'sack_name' => $data['sack_name'],
            'source' => $data['source'] ?? null,
            'date_received' => $data['date_received'],
            'acquisition_cost' => $data['acquisition_cost'] ?? 0.00,
            'status' => $data['status'] ?? 'unopened',
            'notes' => $data['notes'] ?? null,
            'total_items' => $data['total_items'] ?? 0,
            'processed_items' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    
    /**
     * Get inventory item by product ID
     */
    public static function getItemByProduct($productId)
    {
        return \DB::table('inventory_items')->where('product_id', $productId)->first();
    }
    
    /**
     * Create inventory item for a product
     */
    public static function createItem($data)
    {
        return \DB::table('inventory_items')->insertGetId([
            'product_id' => $data['product_id'],
            'sack_id' => $data['sack_id'] ?? null,
            'status' => $data['status'] ?? 'in_stock',
            'location' => $data['location'] ?? null,
            'condition' => $data['condition'] ?? null,
            'notes' => $data['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    
    /**
     * Update inventory item status
     */
    public static function updateItemStatus($productId, $status)
    {
        return \DB::table('inventory_items')
            ->where('product_id', $productId)
            ->update([
                'status' => $status,
                'updated_at' => now()
            ]);
    }
    
    /**
     * Process an item from a sack
     */
    public static function processItem($sackId, $productId)
    {
        // Update sack processed count
        $sack = self::getSack($sackId);
        
        if ($sack) {
            $processedItems = $sack->processed_items + 1;
            $status = $processedItems >= $sack->total_items ? 'completed' : 'processing';
            
            \DB::table('inventory_sacks')
                ->where('id', $sackId)
                ->update([
                    'processed_items' => $processedItems,
                    'status' => $status,
                    'updated_at' => now()
                ]);
        }
        
        return true;
    }

    public static function updateSack($id, $data)
{
    $sack = DB::table('inventory_sacks')->where('id', $id)->update([
        'sack_name' => $data['sack_name'],
        'source' => $data['source'] ?? null,
        'date_received' => $data['date_received'],
        'acquisition_cost' => $data['acquisition_cost'] ?? 0,
        'total_items' => $data['total_items'] ?? 0,
        'notes' => $data['notes'] ?? null,
        'updated_at' => now()
    ]);
    
    return $sack;
}
}