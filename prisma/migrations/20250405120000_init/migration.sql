-- CreateEnum
CREATE TYPE "product_item_type" AS ENUM ('RING', 'NECKLACE', 'BANGLE');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('IN_STOCK', 'SOLD', 'MISSING');

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(128) NOT NULL,
    "floor_label" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "epc_tag_id" VARCHAR(128) NOT NULL,
    "sku_code" VARCHAR(64) NOT NULL,
    "design_name" VARCHAR(256) NOT NULL,
    "item_type" "product_item_type" NOT NULL,
    "gross_weight_grams" DECIMAL(12,4) NOT NULL,
    "net_weight_grams" DECIMAL(12,4) NOT NULL,
    "location_id" UUID NOT NULL,
    "status" "product_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_floor_label_key" ON "locations"("name", "floor_label");

-- CreateIndex
CREATE INDEX "locations_floor_label_idx" ON "locations"("floor_label");

-- CreateIndex
CREATE UNIQUE INDEX "products_epc_tag_id_key" ON "products"("epc_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_code_key" ON "products"("sku_code");

-- CreateIndex
CREATE INDEX "products_location_id_idx" ON "products"("location_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_item_type_idx" ON "products"("item_type");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
