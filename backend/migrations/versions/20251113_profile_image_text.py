"""
Revision ID: 20251113_profile_image_text
Revises: 
Create Date: 2025-11-13

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.alter_column('users', 'profile_image',
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=True)

def downgrade():
    op.alter_column('users', 'profile_image',
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=True)
