<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class StockController
{
    public function updateStock(Request $request)
    {
        $product = Product::find($request->product_id);

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sản phẩm không tồn tại'
            ]);
        }

        $product->stock += $request->quantity_added;
        $product->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thành công'
        ]);
    }
}
