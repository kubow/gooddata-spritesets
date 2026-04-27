# Setting Up Custom Geo Icons in GoodData

This guide covers how to register this spriteset with a GoodData Cloud workspace and use the icons in a geo chart.

## Why jsDelivr instead of GitHub Pages directly

GitHub Pages returns `405 Method Not Allowed` for CORS preflight (`OPTIONS`) requests. GoodData's browser code triggers a preflight when fetching the sprite, which causes the request to be blocked. GitHub Pages cannot be configured to handle `OPTIONS`.

jsDelivr proxies GitHub content and handles CORS preflights correctly, so always use the jsDelivr URL:

```
https://cdn.jsdelivr.net/gh/<github-user>/<repository>@main/dist/sprite
```

For this repository:

```
https://cdn.jsdelivr.net/gh/kubow/gooddata-spritesets@main/dist/sprite
```

## Registering the sprite URL

### Option A: via the UI (may fail with a validation error)

1. In GoodData Cloud, open **Settings → Appearance & Behaviour → Geo Icons**.
2. Paste the jsDelivr URL above into the **Source URL** field.
3. Save.

If the UI shows `The source URL cannot be reached`, use Option B instead — the URL is actually valid but the UI validator has the same OPTIONS preflight issue.

### Option B: via the API (reliable, bypasses UI validation)

You need a GoodData API token. In GoodData, go to your profile → **API Tokens** → create a token. The token is used as a Bearer credential in the format GoodData exports it.

#### Set at organisation level (affects all workspaces)

```bash
curl -X POST \
  -H "Authorization: Bearer <your-api-token>" \
  -H "Content-Type: application/vnd.gooddata.api+json" \
  "https://<your-tenant>.cloud.gooddata.com/api/v1/entities/organizationSettings" \
  -d '{
    "data": {
      "id": "geo-icon-sheet",
      "type": "organizationSetting",
      "attributes": {
        "type": "GEO_ICON_SHEET",
        "content": {
          "value": "https://cdn.jsdelivr.net/gh/kubow/gooddata-spritesets@main/dist/sprite"
        }
      }
    }
  }'
```

If the setting already exists, PATCH it instead:

```bash
curl -X PATCH \
  -H "Authorization: Bearer <your-api-token>" \
  -H "Content-Type: application/vnd.gooddata.api+json" \
  "https://<your-tenant>.cloud.gooddata.com/api/v1/entities/organizationSettings/geo-icon-sheet" \
  -d '{
    "data": {
      "id": "geo-icon-sheet",
      "type": "organizationSetting",
      "attributes": {
        "type": "GEO_ICON_SHEET",
        "content": {
          "value": "https://cdn.jsdelivr.net/gh/kubow/gooddata-spritesets@main/dist/sprite"
        }
      }
    }
  }'
```

#### Set at workspace level only

```bash
curl -X POST \
  -H "Authorization: Bearer <your-api-token>" \
  -H "Content-Type: application/vnd.gooddata.api+json" \
  "https://<your-tenant>.cloud.gooddata.com/api/v1/entities/workspaces/<workspace-id>/workspaceSettings" \
  -d '{
    "data": {
      "type": "workspaceSetting",
      "attributes": {
        "type": "GEO_ICON_SHEET",
        "content": {
          "value": "https://cdn.jsdelivr.net/gh/kubow/gooddata-spritesets@main/dist/sprite"
        }
      }
    }
  }'
```

#### Verify the setting is active

```bash
curl -H "Authorization: Bearer <your-api-token>" \
  "https://<your-tenant>.cloud.gooddata.com/api/v1/actions/workspaces/<workspace-id>/resolveSettings" \
  | python3 -c "import sys,json; [print(s['type'],'->', s['content']) for s in json.load(sys.stdin) if 'GEO' in s['type']]"
```

## Available icon names

The following icon names are available in this spriteset:

| Name | Source file |
|------|-------------|
| `restaurant` | `icons/restaurant.svg` |
| `store` | `icons/store.svg` |
| `subway` | `icons/subway.svg` |
| `warehouse` | `icons/warehouse.svg` |

Icon names come directly from the SVG filenames. To add more icons see the [Adding icons](README.md#adding-icons) section.

## Using icons in a geo chart

Custom pushpin icons have requirements that, if not met, cause the option to be greyed out or unavailable:

- The visualization must be a **geo chart in pushpin mode** (not bubble or heatmap).
- The **Size** and **Color** metric buckets must be **empty**. Having either populated disables custom icon selection.
- The **Segment by** bucket must also be empty (unless using data-driven icons via a `GEO_ICON` label attribute).

### Single icon for all points

1. Open the geo chart in edit mode.
2. Ensure Size, Color, and Segment by are empty.
3. In the chart configuration panel, find **Point type** or **Pushpin icon**.
4. Select one of the icon names from the table above.

### Data-driven icons per point

1. Create a label attribute in your data model with the internal name `GEO_ICON`.
2. Each value in that attribute should match an icon name from the table above (e.g. `restaurant`, `store`).
3. Add the attribute to the **Segment by** bucket in the geo chart.
4. GoodData will render each point with the icon that matches its `GEO_ICON` value.

## CORS configuration note

The GoodData CORS setting (under Admin Console → CORS) controls which origins may call the **GoodData API** from a browser. It does **not** affect GoodData fetching external URLs like sprites. For sprite hosting, what matters is that the sprite host sends `Access-Control-Allow-Origin: *` — which jsDelivr does.
