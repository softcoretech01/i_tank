import sys
import os

# Add parent directory to path so we can import app
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from sqlalchemy import text
from app.seed import init_seed_data

def update_sp():
    print("Updating stored procedure sp_GetAllMasters...")
    sql_path = os.path.join("stored_procedures.sql")
    with open(sql_path, "r") as f:
        content = f.read()
    
    # Simple split by // and execute
    # This is a bit naive but should work for this file structure
    parts = content.split("//")
    db = SessionLocal()
    try:
        for part in parts:
            clean_part = part.replace("DELIMITER", "").strip()
            if not clean_part or clean_part.lower().startswith("delimiter"):
                continue
            if "sp_GetAllMasters" in clean_part:
                # We only really need to update this one for now to avoid complexity
                # But let's try to find the whole procedure block
                pass
        
        # Actually, let's just execute the specific SP update directly here for simplicity and safety
        db.execute(text("DROP PROCEDURE IF EXISTS sp_GetAllMasters"))
        db.execute(text("""
CREATE PROCEDURE sp_GetAllMasters()
BEGIN
    -- Manufacturer
    SELECT manufacturer_id AS id, manufacturer_name AS name FROM manufacturer_master;
    -- Standard
    SELECT id, standard_name AS name FROM standard_master;
    -- TankCode ISO
    SELECT id, tankcode_iso AS name FROM tankcode_iso_master;
    -- UN Code
    SELECT id, un_code AS code FROM un_code_master;
    -- Design Temp
    SELECT id, design_temperature AS name FROM design_temperature_master;
    -- Cabinet
    SELECT id, cabinet_type AS name FROM cabinet_type_master;
    -- Frame Type
    SELECT id, frame_type AS name FROM frame_type_master;
    -- Inspection Agency
    SELECT id, agency_name FROM inspection_agency_master;
    -- Size
    SELECT id, size_code AS code, size_label AS label FROM size_master;
    -- Pump
    SELECT id, pump_value AS name FROM pump_master;
    -- MAWP
    SELECT id, mawp_value AS name FROM mawp_master;
    -- Ownership
    SELECT id, ownership_name AS name FROM ownership_master;
    -- Products
    SELECT id, product_name AS name, un_code_id FROM product_master;
    -- Safety Valve Brands
    SELECT id, brand_name AS name FROM safety_valve_brand;
    -- Master Valves
    SELECT id, valve_name AS name, status FROM master_valve;
    -- Master Gauges
    SELECT id, gauge_name AS name, status FROM master_gauge;
    -- PV Code
    SELECT id, pv_name AS name FROM pv_code_master;
    -- Evacuation Valve Type
    SELECT id, evacuation_valve_type AS name FROM evacuation_valve_type_master;
    -- Color Body Frame
    SELECT id, color_body_frame AS name FROM color_body_frame_master;
END
"""))
        db.commit()
        print("Stored procedure updated.")
    except Exception as e:
        db.rollback()
        print(f"Error updating SP: {e}")
    finally:
        db.close()

def run_seed():
    print("Running seed data...")
    db = SessionLocal()
    try:
        init_seed_data(db)
        print("Seed data completed.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables first (SQLAlchemy will do this via the model imports in seed)
    run_seed()
    update_sp()
