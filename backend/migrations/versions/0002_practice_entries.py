"""Add identity fields, profile display fields, and durable practice entries.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-11
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("identity_provider", sa.String(length=512), nullable=True))
        batch.add_column(sa.Column("external_subject", sa.String(length=512), nullable=True))
        batch.create_unique_constraint(
            "uq_users_identity_provider_subject",
            ["identity_provider", "external_subject"],
        )

    op.add_column("user_profiles", sa.Column("goal_id", sa.String(length=64), nullable=True))
    op.add_column("user_profiles", sa.Column("goal_emoji", sa.String(length=16), nullable=True))
    op.create_table(
        "practice_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("artwork_id", sa.Uuid(), nullable=True),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("exercise", sa.String(length=255), nullable=False),
        sa.Column("skill", sa.String(length=64), nullable=False),
        sa.Column("xp_earned", sa.Integer(), nullable=False),
        sa.Column("practiced_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["artwork_id"], ["artworks.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_practice_entries_artwork_id", "practice_entries", ["artwork_id"])
    op.create_index("ix_practice_entries_user_id", "practice_entries", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_practice_entries_user_id", table_name="practice_entries")
    op.drop_index("ix_practice_entries_artwork_id", table_name="practice_entries")
    op.drop_table("practice_entries")
    op.drop_column("user_profiles", "goal_emoji")
    op.drop_column("user_profiles", "goal_id")
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("uq_users_identity_provider_subject", type_="unique")
        batch.drop_column("external_subject")
        batch.drop_column("identity_provider")