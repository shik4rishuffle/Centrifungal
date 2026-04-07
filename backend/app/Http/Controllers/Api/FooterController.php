<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Statamic\Facades\GlobalSet;

class FooterController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $global = GlobalSet::findByHandle('footer');

        if (!$global) {
            return response()->json(['data' => null], 404);
        }

        $variables = $global->inDefaultSite();

        return response()->json([
            'data' => [
                'tagline' => $variables->get('tagline'),
                'copyright' => $variables->get('copyright'),
                'social_links' => $variables->get('social_links', []),
                'footer_columns' => $variables->get('footer_columns', []),
            ],
        ])->header('Cache-Control', 'public, max-age=300');
    }
}
